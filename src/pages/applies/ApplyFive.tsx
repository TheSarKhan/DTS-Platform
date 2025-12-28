import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { FormContext } from "../../context/FormContext";
import { useLanguage } from "../../context/LanguageContext";
import ApplySteps from "../../components/ApplySteps";
import { motion, AnimatePresence } from "framer-motion";
import { companyService } from "../../services/Operation/company.service";
import ReCAPTCHA from "react-google-recaptcha";
import useRecaptcha from "../../services/Operation/recapture.service";
import {
  CommonApplySVG,
  Five1ApplySvg,
  Five2ApplySvg,
  Five3ApplySvg,
} from "../../components/SVG/Apply";
import { toast } from "react-toastify";

const DB_NAME = "ALL files";
const STORE_NAME = "files";

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveFileToIndexedDB(file: File, FILE_KEY: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put(file, FILE_KEY);
    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });
}

async function getFileFromIndexedDB(
  FILE_KEY: "propertyLawCertificate" | "financialStatement" | "registerCertificate"
): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(FILE_KEY);
    getRequest.onsuccess = () => resolve(getRequest.result || null);
    getRequest.onerror = () => reject(getRequest.error);
  });
}

interface DeclarationAndFileState {
  files: {
    propertyLawCertificate: { name: string; size: number; type: string } | null;
    financialStatement: { name: string; size: number; type: string } | null;
  };
  declaration: {
    dataIsReal: boolean;
    permitContact: boolean;
    privacyAcceptance: boolean;
  };
}

export default function ApplyFive() {
  const navigate = useNavigate();
  const context = useContext(FormContext);
  const { language, pagesTranslations } = useLanguage();
  const { captchaToken, recaptchaRef, handleRecaptcha } = useRecaptcha();
  const page = pagesTranslations.apply5;

  if (!context) {
    throw new Error("ApplyFive must be used within a FormContext.Provider");
  }

  const initialValue: DeclarationAndFileState = {
    files: {
      propertyLawCertificate: null,
      financialStatement: null,
    },
    declaration: {
      dataIsReal: false,
      permitContact: false,
      privacyAcceptance: false,
    },
  };

  const [formData, setFormData] = useState<DeclarationAndFileState>(initialValue);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({
    propertyLawCertificate: "",
    financialStatement: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showThankYouModal, setShowThankYouModal] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [localIsSubmitting, setLocalIsSubmitting] = useState<boolean>(false);

  const propertyLawCertificateRef = useRef<HTMLInputElement>(null);
  const financialStatementRef = useRef<HTMLInputElement>(null);

  // Fayl validasiyası (production üçün vacib)
  const validateFile = (file: File, type: string): boolean => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > MAX_SIZE) {
      setErrors(prev => ({
        ...prev,
        [type]: `File size exceeds 10MB limit`
      }));
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [type]: `Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed`
      }));
      return false;
    }

    return true;
  };

  useEffect(() => {
    const validateForm = () => {
      const filesUploaded =
        formData.files.propertyLawCertificate !== null &&
        formData.files.financialStatement !== null;

      const checkboxesChecked =
        formData.declaration.dataIsReal &&
        formData.declaration.permitContact &&
        formData.declaration.privacyAcceptance;

      setIsFormValid(filesUploaded && checkboxesChecked && captchaToken !== null);
    };
    validateForm();
  }, [formData, captchaToken]);

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem("restOfData") || "null");
    Promise.all([
      getFileFromIndexedDB("propertyLawCertificate").catch(() => null),
      getFileFromIndexedDB("financialStatement").catch(() => null),
    ])
      .then(([propertyFile, financialFile]) => {
        if (savedData) {
          const updatedData = {
            ...savedData,
            files: {
              ...savedData.files,
              ...(propertyFile && {
                propertyLawCertificate: {
                  name: propertyFile.name,
                  size: propertyFile.size,
                  type: propertyFile.type,
                },
              }),
              ...(financialFile && {
                financialStatement: {
                  name: financialFile.name,
                  size: financialFile.size,
                  type: financialFile.type,
                },
              }),
            },
          };
          setFormData(updatedData);

          if (propertyFile && propertyLawCertificateRef.current) {
            propertyLawCertificateRef.current.name = propertyFile.name;
          }
          if (financialFile && financialStatementRef.current) {
            financialStatementRef.current.name = financialFile.name;
          }
        }
      })
      .catch();
  }, []);

  const handleGoBack = () => {
    navigate("/apply/four");
  };

  const showFillToast = (message: string) =>
    toast.warning(message, {
      position: "top-center",
    });

  // ✅ Numunevi sistemə uyğun submit funksiyası
const handleConfirmModalYes = async () => {
  setLocalIsSubmitting(true);
  setSubmissionError(null);
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    
    // 1. Server-ın əsas səhifəsinə bağlana bilirikmi?
   
    // 2. Əgər server çalışırsa, CORS testi
    try {
      const corsTest = await fetch(`${API_URL}/api/v1/companies/add`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
        }
      });
    } catch (corsError) {
    }
    
    // 3. DATA hazırla (əvvəlki kimi)
    const companyData = JSON.parse(localStorage.getItem("companyData")!);
    const digitalAndFinancial = JSON.parse(localStorage.getItem("digitalAndFinancial")!);
    const digitalReadiness = JSON.parse(localStorage.getItem("digitalReadiness")!);
    const propertyLaw = JSON.parse(localStorage.getItem("propertyLaw")!);
    const restOfData = JSON.parse(localStorage.getItem("restOfData")!);
    
    const dataToSubmit = {
      companyData: {
        companyName: companyData.companyName,
        companyRegisterNumber: companyData.companyRegisterNumber,
        createYear: Number(companyData.createYear),
        workerCount: companyData.companySize,
        annualTurnover: companyData.annualTurnover,
        address: companyData.companyAddress,
        cityAndRegion: companyData.location,
        website: companyData.website,
        contactName: companyData.contactPerson,
        contactEmail: companyData.email,
        contactPhone: companyData.phone,
      },
      declarationConsent: {
        dataIsReal: restOfData.declaration.dataIsReal,
        permitContact: restOfData.declaration.permitContact,
        privacyAcceptance: restOfData.declaration.privacyAcceptance,
      },
      digitalLeadership: {
        digitalTeamOrLead: digitalAndFinancial.digital.digitalTeamOrLead,
        digitalPath: digitalAndFinancial.digital.digitalPath,
        digitalTransformationLoyality:
          digitalAndFinancial.digital.digitalTransformationLoyality,
      },
      financialNeeding: {
        financialNeed: digitalAndFinancial.finance.financialNeed,
        neededBudget: digitalAndFinancial.finance.neededBudget,
      },
      digitalReadiness: {
        keyChallenges: digitalReadiness.keyChallenges,
        digitalLevel: Number(digitalReadiness.digitalLevel),
        digitalTools: digitalReadiness.digitalTools,
        companyPurpose: digitalReadiness.companyPurpose,
      },
      propertyLaw: {
        businessOperations: propertyLaw.businessOperations,
        companyLawType: propertyLaw.companyLawType,
        products: propertyLaw.products,
        exportActivity: propertyLaw.exportActivity,
        exportBazaar: propertyLaw.exportBazaar,
      },
    };

    // 4. Faylları yüklə
    const files = {
      propertyLawCertificate: await getFileFromIndexedDB("propertyLawCertificate"),
      registerCertificate: await getFileFromIndexedDB("registerCertificate"),
      financialStatement: await getFileFromIndexedDB("financialStatement"),
    };

    if (!captchaToken) {
      throw new Error("CAPTCHA token is missing");
    }

    
    // 5. İstəyi göndər
    const result = await companyService.submitCompanyData(
      dataToSubmit,
      files,
      captchaToken
    );

    // 6. Response
    if (result.status === 201) {

      recaptchaRef.current?.reset();
      setShowConfirmModal(false);
      setShowThankYouModal(true);
      localStorage.clear();
      
      // IndexedDB təmizlə
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        ["propertyLawCertificate", "registerCertificate", "financialStatement"].forEach(key => {
          store.delete(key);
        });
      } catch (dbError) {
      }
    } else {
      throw new Error(`Unexpected response: ${result.status}`);
    }
    
  } catch (error: any) {

    
    let errorMessage = "Submission failed";
    
    if (error.message.includes('not accessible') || error.message.includes('CANNOT CONNECT')) {
      errorMessage = error.message;
    } else if (error.message.includes('Network Error')) {
      errorMessage = `Network Error - Cannot connect to backend server!\n\nServer: ${import.meta.env.VITE_API_URL}\n\nPlease:\n1. Check if backend server is running\n2. Contact backend developer\n3. Try again later`;
    } else {
      errorMessage = error.message || "Unknown error";
    }
    
    setSubmissionError(errorMessage);
    setRetryCount(prev => prev + 1);
  } finally {
    setLocalIsSubmitting(false);
  }
};

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const updatedValue = e.target.checked;
    const updatedData = {
      ...formData,
      declaration: {
        ...formData.declaration,
        [name]: updatedValue,
      },
    };
    setFormData(updatedData);
    localStorage.setItem("restOfData", JSON.stringify(updatedData));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "propertyLawCertificate" | "financialStatement"
  ) => {
    const file = e.target.files?.[0];

    setErrors(prev => ({
      ...prev,
      [type]: "",
    }));

    if (file) {
      // Fayl validasiyası
      if (!validateFile(file, type)) {
        e.target.value = ''; // Input-u təmizlə
        return;
      }

      try {
        await saveFileToIndexedDB(file, type);
        const updatedData = {
          ...formData,
          files: {
            ...formData.files,
            [type]: { name: file.name, size: file.size, type: file.type },
          },
        };
        setFormData(updatedData);
        localStorage.setItem("restOfData", JSON.stringify(updatedData));
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [type]: "Failed to save file. Please try again."
        }));
      }
    }
  };

  const downloadPDF = (e: React.MouseEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const link = document.createElement("a");
    link.href = "/Privacy.pdf";
    link.download = "Privacy.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
    setSubmissionError(null);
  };

  const handleThankYouModalClose = () => {
    setShowThankYouModal(false);
    navigate("/");
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      handleConfirmModalYes();
    }
  };

  const handleSubmitForm = () => {
    if (isFormValid) {
      setShowConfirmModal(true);
      setSubmissionError(null);
      setRetryCount(0);
    } else {
      // Validation mesajları göstər
      if (!formData.files.propertyLawCertificate) {
        setErrors(prev => ({...prev, propertyLawCertificate: "Required"}));
      }
      if (!formData.files.financialStatement) {
        setErrors(prev => ({...prev, financialStatement: "Required"}));
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[url('/images/space-background.jpg')] bg-cover bg-center bg-no-repeat text-white flex flex-col items-center justify-center py-10">
        <ApplySteps onClick={() => true} step={5} />

        {/* Confirm Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[#121213] rounded-xl w-[440px] p-8 flex flex-col items-center justify-center relative shadow-lg space-y-6"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-white text-xl font-semibold text-center">
                  {page.confirmModal.title[language]}
                </h2>
                <button
                  onClick={handleConfirmModalClose}
                  className="absolute cursor-pointer top-5 right-5 text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Close modal"
                  disabled={localIsSubmitting}
                >
                  <Five1ApplySvg />
                </button>

                {submissionError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-md text-sm mb-4 w-full">
                    <p className="font-medium mb-2">
                      {page.submissionError.errorTitle[language]}
                    </p>
                    <p style={{ whiteSpace: 'pre-line' }}>{submissionError}</p>
                    {retryCount < 3 && (
                      <button
                        onClick={handleRetry}
                        className="mt-3 bg-red-500 text-white py-2 px-4 rounded-md text-sm hover:bg-red-600 transition-colors w-full"
                        disabled={localIsSubmitting}
                      >
                        {page.submissionError.retryButton[language]} (
                        {retryCount + 1}/3)
                      </button>
                    )}
                    {retryCount >= 3 && (
                      <div className="mt-3 text-amber-400 text-xs">
                        <p>{page.submissionError.maxRetryMessage[language]}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-8 w-full justify-center">
                  <button
                    onClick={handleConfirmModalClose}
                    className="border cursor-pointer border-red-500 text-red-500 py-3 px-10 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
                    disabled={localIsSubmitting}
                  >
                    {page.confirmModal.noBtn[language]}
                  </button>
                  <button
                    onClick={handleConfirmModalYes}
                    className="bg-green-500 cursor-pointer text-white py-3 px-10 rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                    disabled={localIsSubmitting}
                  >
                    {localIsSubmitting ? (
                      <span className="flex items-center">
                        <Five2ApplySvg />
                        {page.buttons.submitting[language]}
                      </span>
                    ) : (
                      page.confirmModal.yesBtn[language]
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thank You Modal */}
        <AnimatePresence>
          {showThankYouModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[#121213] rounded-xl w-[440px] p-8 flex flex-col items-center justify-center relative shadow-lg text-center space-y-6"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-white text-2xl font-bold">
                  {page.thankYouModal.title[language]}
                </h2>
                <p className="text-white text-base max-w-[360px] mx-auto">
                  {page.thankYouModal.message[language]}
                </p>

                <button
                  onClick={handleThankYouModalClose}
                  className="absolute top-5 right-5 text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Close modal"
                >
                  <Five3ApplySvg />
                </button>

                <img
                  src="/img/click.svg"
                  alt="Confirmation checkmark"
                  className="w-20 h-20 mx-auto mt-2"
                />

                <button
                  onClick={handleThankYouModalClose}
                  className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {page.thankYouModal.backToHome[language]}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Form */}
        <div className="w-full max-w-4xl p-8 rounded-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold">{page.title[language]}</h1>
          </div>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* File Input 1 */}
            <div className="space-y-2">
              <label
                htmlFor="companyRegistry"
                className="block text-lg cursor-pointer font-medium"
              >
                {page.companyRegistry[language]}
              </label>
              <div className="relative">
                <label
                  htmlFor="propertyLawCertificate"
                  className="w-full h-14 border border-gray-600 rounded-lg flex items-center justify-between px-4 bg-gray-800/30 text-gray-400 text-sm cursor-pointer select-none hover:border-blue-500 transition-colors"
                >
                  <span className="truncate">
                    {formData.files?.propertyLawCertificate
                      ? formData.files.propertyLawCertificate.name
                      : "No file selected"}
                  </span>
                  <Download size={20} className="text-white ml-2" />
                </label>
                <input
                  id="propertyLawCertificate"
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.pdf"
                  ref={propertyLawCertificateRef}
                  onChange={(e) => handleFileChange(e, "propertyLawCertificate")}
                />
              </div>
              <p className="text-sm text-gray-400">
                {page.fileFormatText[language]}
              </p>
              {errors.propertyLawCertificate && (
                <p className="text-red-500 font-medium text-sm mt-1">
                  {errors.propertyLawCertificate}
                </p>
              )}
            </div>

            {/* File Input 2 */}
            <div className="space-y-2">
              <label
                htmlFor="financialReports"
                className="block text-lg cursor-pointer font-medium"
              >
                {page.financialReports[language]}
              </label>
              <div className="relative">
                <label
                  htmlFor="financialStatement"
                  className="w-full h-14 border border-gray-600 rounded-lg flex items-center justify-between px-4 bg-gray-800/30 text-gray-400 text-sm cursor-pointer select-none hover:border-blue-500 transition-colors"
                >
                  <span className="truncate">
                    {formData.files?.financialStatement
                      ? formData.files.financialStatement.name
                      : "No file selected"}
                  </span>
                  <Download size={20} className="text-white ml-2" />
                </label>
                <input
                  id="financialStatement"
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.pdf,.xls,.xlsx"
                  ref={financialStatementRef}
                  onChange={(e) => handleFileChange(e, "financialStatement")}
                />
              </div>
              <p className="text-sm text-gray-400">
                {page.fileFormatText[language]}
              </p>
              <p className="text-sm italic text-[#F9F9F9]">
                {page.applyNeedText[language]}
              </p>
              {errors.financialStatement && (
                <p className="text-red-500 font-medium text-sm mt-1">
                  {errors.financialStatement}
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start">
                <label className="flex items-start cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    name="dataIsReal"
                    checked={formData.declaration.dataIsReal}
                    onChange={handleCheckboxChange}
                    className="hidden"
                  />
                  <span className="mt-1 w-5 h-5 flex items-center justify-center border border-gray-400 rounded bg-gray-800">
                    {formData.declaration.dataIsReal && <CommonApplySVG />}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">
                    {page.checkboxes.dataIsReal[language]}
                  </span>
                </label>
              </div>

              <div className="flex items-start">
                <label className="flex items-start cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    name="permitContact"
                    checked={formData.declaration.permitContact}
                    onChange={handleCheckboxChange}
                    className="hidden"
                  />
                  <span className="mt-1 w-5 h-5 flex items-center justify-center border border-gray-400 rounded bg-gray-800">
                    {formData.declaration.permitContact && <CommonApplySVG />}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">
                    {page.checkboxes.permitContact[language]}
                  </span>
                </label>
              </div>

              <div className="flex items-start">
                <label className="flex items-start cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    name="privacyAcceptance"
                    checked={formData.declaration.privacyAcceptance}
                    onChange={handleCheckboxChange}
                    className="hidden"
                  />
                  <span className="mt-1 w-5 h-5 flex items-center justify-center border border-gray-400 rounded bg-gray-800">
                    {formData.declaration.privacyAcceptance && <CommonApplySVG />}
                  </span>
                  <span
                    className="ml-2 text-sm text-gray-400 underline underline-offset-8 cursor-pointer hover:text-blue-400"
                    onClick={downloadPDF}
                  >
                    {page.checkboxes.privacyAcceptance[language]}
                  </span>
                </label>
              </div>
            </div>

            {/* ReCAPTCHA */}
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LerN1MrAAAAAHK3l-g1D8z0377xlEUT9_SbfQv-"
              onChange={handleRecaptcha}
            />

            {/* Buttons */}
            <div className="flex space-x-4 mt-10">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex-1 cursor-pointer bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {pagesTranslations.applyBtns.backBtn[language]}
              </button>

              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={!isFormValid || localIsSubmitting}
                className={`flex-1 py-3 rounded-lg transition-colors ${isFormValid && !localIsSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-blue-900/50 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {localIsSubmitting
                  ? page.buttons.submitting[language]
                  : page.buttons.confirm[language]}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}