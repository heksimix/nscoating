"use client";

import * as React from "react";
import type { CompanyData } from "@/lib/schemas";

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
