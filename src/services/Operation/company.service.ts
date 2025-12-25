import API from "../API/axiosConfig.api";

interface CompanyRequest {
  companyData: {
    companyName: string;
    companyRegisterNumber: string;
    createYear: number;
    workerCount: string;
    annualTurnover: string;
    address: string;
    cityAndRegion: string;
    website: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
  declarationConsent: {
    dataIsReal: boolean;
    permitContact: boolean;
    privacyAcceptance: boolean;
  };
  digitalLeadership: {
    digitalTeamOrLead: boolean;
    digitalPath: boolean;
    digitalTransformationLoyality: boolean;
  };
  financialNeeding: {
    financialNeed: boolean;
    neededBudget: string;
  };
  digitalReadiness: {
    keyChallenges: string[];
    digitalLevel: number;
    digitalTools: string[];
    companyPurpose: string;
  };
  propertyLaw: {
    businessOperations: string;
    companyLawType: string;
    products: string;
    exportActivity: boolean;
    exportBazaar: string[];
  };
}

interface ApiResponse {
  status: number;
  data: any;
  statusText: string;
  headers: any;
  config: any;
}

interface CompanyFiles {
  propertyLawCertificate: File | null;
  registerCertificate?: File | null;
  financialStatement?: File | null;
}

export const companyService = {
  submitCompanyData: async (
    companyRequest: CompanyRequest,
    files: CompanyFiles,
    captchaToken: string
  ): Promise<ApiResponse> => {
    const formData = new FormData();

    // 1. JSON data
    const companyRequestBlob = new Blob(
      [JSON.stringify(companyRequest)],
      { type: "application/json" }
    );
    formData.append("companyRequest", companyRequestBlob);

    // 2. recaptchaToken: Sadə string kimi
    // ❌ Blob YOX, sadə string göndərin
    formData.append("recaptchaToken", captchaToken);

    // 3. Fayllar
    if (files.propertyLawCertificate) {
      formData.append("propertyLawCertificate", files.propertyLawCertificate);
    }

    // registerCertificate (optional)
    if (files.registerCertificate) {
      formData.append("registerCertificate", files.registerCertificate);
    }

    // financialStatement (optional)
    if (files.financialStatement) {
      formData.append("financialStatement", files.financialStatement);
    }

    // ✅ DEBUG: FormData məzmununu yoxla (numunevi sistemdəki kimi)
    
    // Type-safe yanaşma
    const entriesArray: [string, any][] = [];
    for (const entry of formData.entries()) {
      entriesArray.push(entry);
    }
    
    entriesArray.forEach(([key, value]) => {
      const val = value as any;
      
      // Type-safe yoxlanış
      if (val && typeof val === 'object') {
        if ('type' in val && 'size' in val) {
          // Blob və ya File
          
          if ('name' in val) {
          }
        }
      }
    });

    try {
      
      // ✅ NUMUNEVI SİSTEM QAYDASI: Content-Type YAZMA, Axios özü əlavə edir
      const response = await API.post("/api/v1/companies/add", formData);
      
      
      return {
        status: response.status,
        data: response.data,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
      
    } catch (error: any) {
      console.error("❌ API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw error;
    }
  },
};