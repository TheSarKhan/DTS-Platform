import { useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ErrorMessage, Field, Formik } from "formik";
import { useNavigate } from "react-router-dom";

const ChangeOwnPasswordModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    oldPassword: Yup.string().required("Köhnə şifrə mütləqdir"),
    newPassword: Yup.string()
      .min(8, "Şifrə ən az 8 simvoldan ibarət olmalıdır")
      .required("Yeni şifrə mütləqdir"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "şifrələr uyğun gəlmir")
      .required("Şifrəni təsdiqləyin"),
  });

  const handleSubmit = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      setLoading(true);
      await axiosPrivate.patch(`/api/v1/auth/reset-current-password`, null, {
        params: {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        },
      });

      toast.success("Şifrə uğurla yeniləndi");
      onClose();
      navigate("/login");
    } catch (err: any) {
      console.error("Password change error:", err);
      toast.error("Şifrə dəyişdirilərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Formik
        initialValues={{
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit }) => (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg w-[90%] max-w-md space-y-5 relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-3">Şifrəni dəyiş</h2>

            <div>
              <label className="block mb-1 text-sm">Köhnə şifrə</label>
              <Field
                name="oldPassword"
                type="password"
                placeholder="Köhnə şifrə"
                className="w-full border border-[#CED4DA] p-2 rounded"
              />
              <ErrorMessage
                name="oldPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Yeni şifrə</label>
              <Field
                name="newPassword"
                type="password"
                placeholder="Yeni şifrə"
                className="w-full border border-[#CED4DA] p-2 rounded"
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Şifrəni təsdiqləyin</label>
              <Field
                name="confirmPassword"
                type="password"
                placeholder="Şifrəni təsdiqləyin"
                className="w-full border border-[#CED4DA] p-2 rounded"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded text-white ${
                loading ? "bg-gray-400" : "bg-[#1A4381] hover:bg-[#17376d]"
              }`}
            >
              {loading ? "Yenilənir..." : "Təsdiqlə"}
            </button>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default ChangeOwnPasswordModal;
