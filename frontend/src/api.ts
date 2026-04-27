const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export type LoginResponse = {
  accessToken: string;
  user: {
    manv: string;
    hoten: string;
    email: string;
    tendn: string;
    pubkey: string;
  };
};

export type LopItem = {
  malop: string;
  tenlop: string;
  manv: string;
};

export type StudentItem = {
  MASV: string;
  HOTEN: string;
  NGAYSINH: string;
  DIACHI: string;
  MALOP: string;
  TENLOP: string;
  TENDN: string;
};

function parseErrorMessage(errorBody: unknown): string {
  if (typeof errorBody === 'string') {
    return errorBody;
  }

  if (typeof errorBody === 'object' && errorBody !== null) {
    const message = (errorBody as { message?: string | string[] }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Co loi xay ra. Vui long thu lai.';
}

export async function login(tendn: string, matkhau: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tendn, matkhau }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }

  return response.json() as Promise<LoginResponse>;
}

export async function getAllClasses(
  token: string,
): Promise<(LopItem & { tenquanly: string })[]> {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }

  return response.json() as Promise<(LopItem & { tenquanly: string })[]>;
}

export async function createClass(token: string, malop: string, tenlop: string) {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ malop, tenlop }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}

export async function updateClass(token: string, malop: string, tenlop: string) {
  const response = await fetch(`${API_BASE_URL}/classes/${encodeURIComponent(malop)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenlop }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}

export async function deleteClass(token: string, malop: string) {
  const response = await fetch(`${API_BASE_URL}/classes/${encodeURIComponent(malop)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}

// ============= STUDENTS APIs =============

export async function getAllStudents(token: string): Promise<StudentItem[]> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }

  return response.json() as Promise<StudentItem[]>;
}

export async function createStudent(
  token: string,
  student: {
    MASV: string;
    HOTEN: string;
    NGAYSINH: string;
    DIACHI: string;
    MALOP: string;
    TENDN: string;
    MK: string;
  },
) {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(student),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}

export async function updateStudent(
  token: string,
  masv: string,
  student: {
    HOTEN?: string;
    NGAYSINH?: string;
    DIACHI?: string;
    MALOP?: string;
  },
) {
  const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(masv)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(student),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}

export async function deleteStudent(token: string, masv: string) {
  const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(masv)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body));
  }
}