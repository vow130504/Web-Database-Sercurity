import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass, deleteClass, getAllClasses, updateClass } from '../api';
import type { LopItem } from '../api';

type ExtendedLopItem = LopItem & { tenquanly: string };
type UserInfo = {
  manv: string;
  hoten: string;
  tendn: string;
  email: string;
};

export default function ClassesPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [allClasses, setAllClasses] = useState<ExtendedLopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newMaLop, setNewMaLop] = useState('');
  const [newTenLop, setNewTenLop] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingMaLop, setEditingMaLop] = useState('');
  const [editingTenLop, setEditingTenLop] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('lab3_access_token');
    const storedUser = localStorage.getItem('lab3_user');

    if (!storedToken || !storedUser) {
      navigate('/', { replace: true });
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser) as UserInfo);

    void loadAllClasses(storedToken);
  }, [navigate]);

  async function loadAllClasses(currentToken: string) {
    setLoading(true);
    setError('');
    try {
      const data = await getAllClasses(currentToken);
      setAllClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách lớp.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    try {
      await createClass(token, newMaLop.trim(), newTenLop.trim());
      setNewMaLop('');
      setNewTenLop('');
      setShowAddForm(false);
      await loadAllClasses(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được lớp.');
    }
  }

  async function handleUpdate(malop: string) {
    if (!token || !editingTenLop.trim()) return;

    try {
      await updateClass(token, malop, editingTenLop.trim());
      setEditingMaLop('');
      setEditingTenLop('');
      await loadAllClasses(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được lớp.');
    }
  }

  async function handleDelete(malop: string, tenlop: string) {
    if (!token) return;

    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa lớp "${tenlop}" không?`);
    if (!confirmed) return;

    try {
      await deleteClass(token, malop);
      await loadAllClasses(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được lớp.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('lab3_access_token');
    localStorage.removeItem('lab3_user');
    navigate('/', { replace: true });
  }

  const canEdit = (lopItem: ExtendedLopItem) => lopItem.manv === user?.manv;
  const userInitials =
    user?.hoten
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'NV';

  return (
    <div className="classes-container">
      <div className="classes-layout">
        <aside className="classes-sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo" aria-hidden="true">
              📚
            </div>
            <div className="brand-text">Hệ thống quản lý sinh viên</div>
          </div>

          <div className="sidebar-user-card">
            <div className="sidebar-user-top">
              <div className="sidebar-avatar" aria-hidden="true">
                {userInitials}
              </div>
              <div className="sidebar-user-meta">
                <p className="sidebar-user-name">{user?.hoten ?? 'Nhân viên'}</p>
                <p className="sidebar-user-id">{user?.email ?? 'nhanvien@gmail.com'}</p>
              </div>
            </div>
            <div className="sidebar-online">
              <span className="online-dot" aria-hidden="true" />
              Trực tuyến
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="sidebar-tab active" type="button">
              Quản lý lớp học
            </button>
            <button className="sidebar-tab" type="button">
              Thông tin nhân viên
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="classes-main">
          <header className="classes-header">
            <div className="header-left">
              <h1>Quản Lý Lớp Học</h1>
              <p>Danh sách các lớp học trong hệ thống</p>
            </div>
          </header>

          <div className="classes-content">
            <div className="add-class-section">
              {!showAddForm ? (
                <button className="add-btn" onClick={() => setShowAddForm(true)}>
                  + Thêm Lớp Mới
                </button>
              ) : (
                <form onSubmit={handleCreate} className="add-form">
                  <input
                    type="text"
                    value={newMaLop}
                    onChange={(e) => setNewMaLop(e.target.value)}
                    placeholder="Mã lớp (VD: L01)"
                    required
                  />
                  <input
                    type="text"
                    value={newTenLop}
                    onChange={(e) => setNewTenLop(e.target.value)}
                    placeholder="Tên lớp"
                    required
                  />
                  <button type="submit">Lưu</button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowAddForm(false)}
                  >
                    Hủy
                  </button>
                </form>
              )}
            </div>

            {error && <div className="alert-error">{error}</div>}

            <div className="classes-table-wrapper">
              {loading ? (
                <div className="loading">Đang tải dữ liệu...</div>
              ) : allClasses.length === 0 ? (
                <div className="no-data">Không có lớp nào trong hệ thống.</div>
              ) : (
                <table className="classes-table">
                  <thead>
                    <tr>
                      <th>Mã Lớp</th>
                      <th>Tên Lớp</th>
                      <th>Giảng Viên Quản Lý</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClasses.map((item) => {
                      const isEditing = editingMaLop === item.malop;
                      const isMine = canEdit(item);

                      return (
                        <tr key={item.malop} className={isMine ? 'my-class' : ''}>
                          <td className="col-malop">{item.malop}</td>
                          <td className="col-tenlop">
                            {isEditing ? (
                              <input
                                className="edit-input"
                                value={editingTenLop}
                                onChange={(e) => setEditingTenLop(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              item.tenlop
                            )}
                          </td>
                          <td className="col-tenquanly">{item.tenquanly}</td>
                          <td className="col-actions">
                            {isEditing ? (
                              <>
                                <button
                                  className="icon-btn save-btn"
                                  onClick={() => void handleUpdate(item.malop)}
                                  title="Lưu"
                                >
                                  ✓
                                </button>
                                <button
                                  className="icon-btn cancel-btn"
                                  onClick={() => {
                                    setEditingMaLop('');
                                    setEditingTenLop('');
                                  }}
                                  title="Hủy"
                                >
                                  ✕
                                </button>
                              </>
                            ) : isMine ? (
                              <>
                                <button
                                  className="icon-btn edit-btn"
                                  onClick={() => {
                                    setEditingMaLop(item.malop);
                                    setEditingTenLop(item.tenlop);
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  ✎
                                </button>
                                <button
                                  className="icon-btn delete-btn"
                                  onClick={() => void handleDelete(item.malop, item.tenlop)}
                                  title="Xóa"
                                >
                                  🗑
                                </button>
                              </>
                            ) : (
                              <span className="no-action">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}