import { useEffect, useState } from 'react';
import { getAllStudents, getAllClasses, createStudent, updateStudent, deleteStudent, type StudentItem, type LopItem } from '../api';

const StudentsPage = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<(LopItem & { tenquanly: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token') || '';

  const [formData, setFormData] = useState({
    MASV: '',
    HOTEN: '',
    NGAYSINH: '',
    DIACHI: '',
    MALOP: '',
    TENDN: '',
    MK: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        getAllStudents(token),
        getAllClasses(token),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Lọc sinh viên theo lớp được chọn
  const filteredStudents = selectedClass
    ? students.filter((s) => s.MALOP === selectedClass)
    : students;

  // Kiểm tra xem nhân viên hiện tại có quản lý lớp được chọn không
  const canEditSelectedClass =
    selectedClass && classes.some((c) => c.malop === selectedClass && c.manv === user.username);

  const handleSelectClass = (malop: string) => {
    setSelectedClass(malop);
  };

  const handleOpenModal = (student?: StudentItem) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        MASV: student.MASV,
        HOTEN: student.HOTEN,
        NGAYSINH: student.NGAYSINH,
        DIACHI: student.DIACHI,
        MALOP: student.MALOP,
        TENDN: student.TENDN,
        MK: '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        MASV: '',
        HOTEN: '',
        NGAYSINH: '',
        DIACHI: '',
        MALOP: selectedClass,
        TENDN: '',
        MK: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      MASV: '',
      HOTEN: '',
      NGAYSINH: '',
      DIACHI: '',
      MALOP: '',
      TENDN: '',
      MK: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingStudent) {
        // Update
        await updateStudent(token, editingStudent.MASV, {
          HOTEN: formData.HOTEN,
          NGAYSINH: formData.NGAYSINH,
          DIACHI: formData.DIACHI,
          MALOP: formData.MALOP,
        });
        alert('Cập nhật sinh viên thành công!');
      } else {
        // Create
        await createStudent(token, formData);
        alert('Thêm sinh viên thành công!');
      }
      handleCloseModal();
      await fetchData();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (masv: string) => {
    if (window.confirm('Bạn có chắc muốn xóa sinh viên này? Sẽ xóa kèm toàn bộ điểm của sinh viên.')) {
      try {
        setLoading(true);
        await deleteStudent(token, masv);
        alert('Xóa sinh viên thành công!');
        await fetchData();
        setError('');
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Sinh viên</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>}

      {/* Chọn lớp */}
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Chọn lớp:</label>
        <select
          value={selectedClass}
          onChange={(e) => handleSelectClass(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Tất cả các lớp --</option>
          {classes.map((c) => (
            <option key={c.malop} value={c.malop}>
              {c.tenlop} ({c.malop}) - Quản lý: {c.tenquanly}
            </option>
          ))}
        </select>
      </div>

      {/* Nút thêm sinh viên */}
      {selectedClass && canEditSelectedClass && (
        <button
          onClick={() => handleOpenModal()}
          className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          + Thêm sinh viên
        </button>
      )}

      {/* Bảng sinh viên */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded">
          <thead className="bg-blue-100">
            <tr>
              <th className="border p-3 text-left">MASV</th>
              <th className="border p-3 text-left">Họ tên</th>
              <th className="border p-3 text-left">Ngày sinh</th>
              <th className="border p-3 text-left">Địa chỉ</th>
              <th className="border p-3 text-left">Lớp</th>
              <th className="border p-3 text-left">Tên đăng nhập</th>
              <th className="border p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="border p-3 text-center text-gray-500">
                  Không có sinh viên nào
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                // Kiểm tra xem nhân viên hiện tại có quyền sửa sinh viên này không
                const studentClass = classes.find((c) => c.malop === student.MALOP);
                const canEdit = studentClass && studentClass.manv === user.username;

                return (
                  <tr key={student.MASV} className="hover:bg-gray-50">
                    <td className="border p-3">{student.MASV}</td>
                    <td className="border p-3">{student.HOTEN}</td>
                    <td className="border p-3">
                      {student.NGAYSINH ? new Date(student.NGAYSINH).toLocaleDateString('vi-VN') : ''}
                    </td>
                    <td className="border p-3">{student.DIACHI}</td>
                    <td className="border p-3">{student.TENLOP}</td>
                    <td className="border p-3">{student.TENDN}</td>
                    <td className="border p-3 text-center">
                      {canEdit ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenModal(student)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            disabled={loading}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(student.MASV)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            disabled={loading}
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Không có quyền</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingStudent ? 'Sửa sinh viên' : 'Thêm sinh viên'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStudent && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Mã SV *</label>
                    <input
                      type="text"
                      name="MASV"
                      value={formData.MASV}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded"
                      disabled={editingStudent !== null}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Tên đăng nhập *</label>
                    <input
                      type="text"
                      name="TENDN"
                      value={formData.TENDN}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Mật khẩu *</label>
                    <input
                      type="password"
                      name="MK"
                      value={formData.MK}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold mb-1">Họ tên *</label>
                <input
                  type="text"
                  name="HOTEN"
                  value={formData.HOTEN}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ngày sinh *</label>
                <input
                  type="date"
                  name="NGAYSINH"
                  value={formData.NGAYSINH}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Địa chỉ *</label>
                <input
                  type="text"
                  name="DIACHI"
                  value={formData.DIACHI}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Lớp *</label>
                <select
                  name="MALOP"
                  value={formData.MALOP}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                  disabled={editingStudent !== null}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes
                    .filter((c) => c.manv === user.username)
                    .map((c) => (
                      <option key={c.malop} value={c.malop}>
                        {c.tenlop} ({c.malop})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : editingStudent ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;