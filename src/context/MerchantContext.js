import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { merchants as initialMerchants } from "../data";
import { readJSON, STORAGE_KEYS, writeJSON } from "../utils/storage";

const MerchantContext = createContext();

export const useMerchants = () => useContext(MerchantContext);

export const MerchantProvider = ({ children }) => {
    const [merchantsList, setMerchantsList] = useState(() => {
        const stored = readJSON(STORAGE_KEYS.MERCHANTS_LIST);
        return Array.isArray(stored) && stored.length > 0 ? stored : initialMerchants;
    });

    useEffect(() => {
        writeJSON(STORAGE_KEYS.MERCHANTS_LIST, merchantsList);
    }, [merchantsList]);

    const addMerchant = useCallback((newMerchant) => {
        setMerchantsList((prev) => [...prev, newMerchant]);
    }, []);

    const deleteMerchant = useCallback((merchantId) => {
        setMerchantsList((prev) => prev.filter((merchant) => merchant.id !== merchantId));
    }, []);

    const getMerchantById = useCallback((id) => {
        return merchantsList.find((merchant) => merchant.id === id);
    }, [merchantsList]);

    const value = useMemo(() => ({
        merchantsList,
        addMerchant,
        deleteMerchant,
        getMerchantById,
    }), [addMerchant, deleteMerchant, getMerchantById, merchantsList]);

    return (
        <MerchantContext.Provider value={value}>
            {children}
        </MerchantContext.Provider>
    );
};
