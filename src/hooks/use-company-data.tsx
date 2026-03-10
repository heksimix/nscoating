"use client";

import * as React from "react";

export interface CompanyData {
  name: string;
  address: string;
  eik: string;
  mol: string;
  logoUrl: string;
}

const defaultCompanyData: CompanyData = {
  name: "",
  address: "",
  eik: "",
  mol: "",
  logoUrl: "",
};

export function useCompanyData() {
  const [companyData, setCompanyData] = React.useState<CompanyData>(defaultCompanyData);
  const isMounted = React.useRef(false);

  // Load from localStorage on initial client-side render
  React.useEffect(() => {
    try {
      const item = window.localStorage.getItem("companyData");
      if (item) {
        setCompanyData(JSON.parse(item));
      }
    } catch (error) {
      console.warn("Error reading localStorage key “companyData”:", error);
    }
  }, []);

  // Save to localStorage on subsequent updates, skipping the initial render
  React.useEffect(() => {
    if (isMounted.current) {
      try {
        window.localStorage.setItem("companyData", JSON.stringify(companyData));
      } catch (error) {
        console.warn("Error setting localStorage key “companyData”:", error);
      }
    } else {
      isMounted.current = true;
    }
  }, [companyData]);

  return { companyData, setCompanyData };
}
