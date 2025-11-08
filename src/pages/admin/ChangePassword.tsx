import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from "formik";
import * as Yup from "yup";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface FormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Schema = Yup.object({
  oldPassword: Yup.string().required("Köhnə şifrə vacibdir"),
  newPassword: Yup.string()
    .min(8, "Şifrə ən azı 8 simvol olmalıdır")
    .required("Yeni şifrə vacibdir"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Şifrələr uyğun deyil")
    .required("Təkrar şifrə vacibdir"),
});

const ChangePassword: React.FC = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>
  ) => {
    try {
      await axiosPrivate.patch(
        `/api/v1/auth/reset-current-password`,
        {},
        {
          params: {
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
          },
        }
      );

      toast.success("Şifrə uğurla dəyişdirildi");
      navigate("/login");
      resetForm();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(
        error?.response?.data?.message || "Şifrəni dəyişərkən xəta baş verdi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.title = "Şifrəni dəyiş";
    return () => {
      document.title = "DTS Platform";
    };
  }, []);

  return (
    <div className="h-dvh w-full flex items-center justify-center flex-col">
      <div className="rounded-lg w-full max-w-md space-y-6 relative z-20 p-10 bg-white shadow-xl flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl mb-8 font-medium text-center font-plus-jakarta">
          Şifrəni dəyiş
        </h1>

        <Formik
          initialValues={{
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={Schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="w-full flex flex-col gap-6">
              {/* Old Password */}
              <div className="space-y-2">
                <label htmlFor="oldPassword" className="text-sm font-light">
                  Köhnə şifrə<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Field
                    id="oldPassword"
                    name="oldPassword"
                    type={showOld ? "text" : "password"}
                    placeholder="Köhnə şifrə"
                    className="w-full border rounded-md p-3 pr-10 bg-transparent focus:outline-none focus:ring-2 transition duration-300 border-[#D1D1D1] focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[25%] text-gray-400 cursor-pointer"
                    onClick={() => setShowOld(!showOld)}
                  >
                    {showOld ? (
                      <Visibility className="w-4 h-4" />
                    ) : (
                      <VisibilityOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="oldPassword"
                  component="p"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-light">
                  Yeni şifrə<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Field
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Yeni şifrə"
                    className="w-full border rounded-md p-3 pr-10 bg-transparent focus:outline-none focus:ring-2 transition duration-300 border-[#D1D1D1] focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[25%] text-gray-400 cursor-pointer"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? (
                      <Visibility className="w-4 h-4" />
                    ) : (
                      <VisibilityOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="newPassword"
                  component="p"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-light">
                  Şifrəni təkrar daxil edin
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Təkrar şifrə"
                    className="w-full border rounded-md p-3 pr-10 bg-transparent focus:outline-none focus:ring-2 transition duration-300 border-[#D1D1D1] focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[25%] text-gray-400 cursor-pointer"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <Visibility className="w-4 h-4" />
                    ) : (
                      <VisibilityOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="confirmPassword"
                  component="p"
                  className="text-red-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 px-4 py-2 hover:bg-[#122e58] bg-[#1A4381] transition-all rounded-[34px] shadow-xl text-[16px] uppercase tracking-wider text-white font-light cursor-pointer disabled:opacity-50"
              >
                Göndər
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ChangePassword;
