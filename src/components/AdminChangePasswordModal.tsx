import { useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ErrorMessage, Field, Formik } from "formik";

const ChangePasswordModal = ({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: number | undefined;
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, "Parol ən az 8 simvoldan ibarət olmalıdır")
      .required("Yeni parol mütləqdir"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Parollar uyğun gəlmir")
      .required("Parolu təsdiqləyin"),
  });

  const handleSubmit = async (values: { newPassword: string }) => {
    try {
      setLoading(true);
      await axiosPrivate.patch(`/api/v1/admins/change-user-password`, null, {
        params: {
          id: userId,
          newPassword: values.newPassword,
        },
        headers: {
          Accept: "*/*",
        },
      });

      toast.success("Parol uğurla yeniləndi");
      onClose();
    } catch (err: any) {
      console.error("Password change error:", err);
      toast.error("Parol dəyişdirilərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Formik
        initialValues={{ newPassword: "", confirmPassword: "" }}
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

            <h2 className="text-lg font-semibold mb-3">Yeni parol təyin et</h2>

            <div>
              <label className="block mb-1 text-sm">Yeni parol</label>
              <Field
                name="newPassword"
                type="password"
                placeholder="Yeni parol"
                className="w-full border border-[#CED4DA] p-2 rounded"
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Parolu təsdiqləyin</label>
              <Field
                name="confirmPassword"
                type="password"
                placeholder="Parolu təsdiqləyin"
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

export default ChangePasswordModal;
