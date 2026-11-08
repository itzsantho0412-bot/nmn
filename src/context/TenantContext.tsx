import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.ts';
import { useAuth } from './AuthContext.tsx';
import { Business, BusinessCategory, BusinessConfigLabels, SaaSPlan } from '../types/index.ts';
import { getCategoryLabels } from '../config/businessCategories.ts';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers.ts';

interface RegisterBusinessInput {
  name: string;
  category: BusinessCategory;
  phone?: string;
  address?: string;
  currency?: string;
  primaryBranchName?: string;
}

interface TenantContextType {
  currentBusiness: Business | null;
  businesses: Business[];
  loadingBusinesses: boolean;
  labels: BusinessConfigLabels;
  registerBusiness: (input: RegisterBusinessInput) => Promise<Business>;
  selectBusiness: (business: Business) => void;
  updateBusinessCategory: (category: BusinessCategory) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Load businesses for the current user
  const refreshBusinesses = useCallback(async () => {
    if (!currentUser) {
      setBusinesses([]);
      setCurrentBusiness(null);
      return;
    }

    setLoadingBusinesses(true);
    try {
      let businessList: Business[] = [];

      if (isSuperAdmin) {
        // Super admins can fetch all businesses
        const businessesSnap = await getDocs(collection(db, 'businesses'));
        businessList = businessesSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as Business),
          id: docSnap.id,
        }));
      } else {
        // 1. Fetch businesses owned by this user
        const qOwned = query(collection(db, 'businesses'), where('ownerId', '==', currentUser.uid));
        const ownedSnap = await getDocs(qOwned);
        businessList = ownedSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as Business),
          id: docSnap.id,
        }));

        // 2. Fetch businesses where user is staff/member via business_memberships
        const qMember = query(
          collection(db, 'business_memberships'),
          where('userId', '==', currentUser.uid)
        );
        const memberSnap = await getDocs(qMember);

        for (const membershipDoc of memberSnap.docs) {
          const membershipData = membershipDoc.data();
          const bId = membershipData.businessId;
          // Avoid duplicate if already fetched as owner
          if (!businessList.some((b) => b.id === bId)) {
            const bDoc = await getDoc(doc(db, 'businesses', bId));
            if (bDoc.exists()) {
              businessList.push({
                ...(bDoc.data() as Business),
                id: bDoc.id,
              });
            }
          }
        }
      }

      setBusinesses(businessList);

      // Keep current selection or default to the first business
      if (businessList.length > 0) {
        setCurrentBusiness((prev) => {
          if (prev && businessList.some((b) => b.id === prev.id)) {
            return businessList.find((b) => b.id === prev.id) || businessList[0];
          }
          return businessList[0];
        });
      } else {
        setCurrentBusiness(null);
      }
    } catch (err: unknown) {
      console.warn('Could not load businesses on initial check:', err);
      setBusinesses([]);
    } finally {
      setLoadingBusinesses(false);
    }
  }, [currentUser, isSuperAdmin]);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  // Register a brand new tenant business with isolated subcollections and default plans
  const registerBusiness = async (input: RegisterBusinessInput): Promise<Business> => {
    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      throw new Error('Please sign in with Google to create and register your business workspace.');
    }

    const businessId = 'biz_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const branchId = 'br_' + Math.random().toString(36).substring(2, 8);
    const nowIso = new Date().toISOString();

    const newBusiness: Business = {
      id: businessId,
      name: input.name.trim(),
      category: input.category,
      ownerId: activeUser.uid,
      ownerEmail: activeUser.email || 'owner@example.com',
      phone: input.phone || '',
      address: input.address || '',
      currency: input.currency || 'INR',
      subscriptionPlan: 'trial' as SaaSPlan,
      status: 'active',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14-day free trial
      createdAt: nowIso,
      updatedAt: nowIso,
      primaryBranchName: input.primaryBranchName || 'Main Center',
    };

    try {
      // 1. Create Business Document
      await setDoc(doc(db, 'businesses', businessId), newBusiness);

      // 2. Create Owner Membership record
      const membershipId = `${businessId}_${activeUser.uid}`;
      await setDoc(doc(db, 'business_memberships', membershipId), {
        id: membershipId,
        businessId,
        userId: activeUser.uid,
        email: activeUser.email || '',
        role: 'owner',
        permissions: ['all'],
        createdAt: nowIso,
      });

      // 3. Create Primary Branch
      await setDoc(doc(db, 'businesses', businessId, 'branches', branchId), {
        id: branchId,
        businessId,
        name: input.primaryBranchName || 'Main Center',
        isPrimary: true,
        address: input.address || '',
        phone: input.phone || '',
      });

      // 4. Seed initial default plans based on category
      const labels = getCategoryLabels(input.category);
      for (const defaultPlan of labels.defaultPlanDurations) {
        const planId = 'plan_' + Math.random().toString(36).substring(2, 8);
        await setDoc(doc(db, 'businesses', businessId, 'plans', planId), {
          id: planId,
          businessId,
          name: defaultPlan.name,
          durationMonths: defaultPlan.months,
          price: defaultPlan.defaultPrice,
          description: `Standard ${defaultPlan.months} month(s) package for ${labels.memberSingular.toLowerCase()}s`,
          isActive: true,
        });
      }

      setBusinesses((prev) => [newBusiness, ...prev]);
      setCurrentBusiness(newBusiness);
      setIsRegisterModalOpen(false);
      return newBusiness;
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}`);
    }
  };

  const updateBusinessCategory = async (category: BusinessCategory) => {
    if (!currentBusiness) return;
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'businesses', currentBusiness.id), {
        category,
        updatedAt: nowIso,
      });
      const updated = { ...currentBusiness, category, updatedAt: nowIso };
      setCurrentBusiness(updated);
      setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${currentBusiness.id}`);
    }
  };

  const labels = getCategoryLabels(currentBusiness?.category || 'gym');

  return (
    <TenantContext.Provider
      value={{
        currentBusiness,
        businesses,
        loadingBusinesses,
        labels,
        registerBusiness,
        selectBusiness: (b) => setCurrentBusiness(b),
        updateBusinessCategory,
        refreshBusinesses,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
