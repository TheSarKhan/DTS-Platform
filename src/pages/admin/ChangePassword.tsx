import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from "formik";
import * as Yup from "yup";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface FormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Schema = Yup.object({
  oldPassword: Yup.string().required("Köhnə şifrə vacibdir"),
  newPassword: Yup.string()
    .min(6, "Şifrə ən azı 8 simvol olmalıdır")
    .required("Yeni şifrə vacibdir"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Şifrələr uyğun deyil")
    .required("Təkrar şifrə vacibdir"),
});

const ChangePassword: React.FC = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

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
    <div className="bg-white rounded-[8px] w-content max-w-[600px] p-[30px]">
      <h1 className="text-start font-[500] text-[22px] mb-5">Şifrəni dəyiş</h1>
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
          <Form className="flex flex-col gap-6">
            {/* Old Password */}
            <div>
              <label htmlFor="oldPassword" className="block mb-1 font-medium">
                Köhnə şifrə<span className="text-red-500">*</span>
              </label>
              <Field
                id="oldPassword"
                name="oldPassword"
                type="password"
                placeholder="Köhnə şifrə"
                className="border border-[#CED4DA] rounded-[8px] p-2 w-full focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="oldPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block mb-1 font-medium">
                Yeni şifrə<span className="text-red-500">*</span>
              </label>
              <Field
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Yeni şifrə"
                className="border border-[#CED4DA] rounded-[8px] p-2 w-full focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 font-medium"
              >
                Şifrəni təkrar daxil edin
                <span className="text-red-500">*</span>
              </label>
              <Field
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Təkrar şifrə"
                className="border border-[#CED4DA] rounded-[8px] p-2 w-full focus:outline-none focus:border-blue-500"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div className="text-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#E8ECF2] text-[#1A4381] cursor-pointer px-6 py-2 rounded disabled:opacity-50 transition-all duration-500 hover:bg-[#1A4381] hover:text-white"
              >
                Göndər
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ChangePassword;
