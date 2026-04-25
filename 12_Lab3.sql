--a) Viết script tạo Database có tên QLSVNhom.
USE master;
GO

IF DB_ID('QLSVNhom') IS NOT NULL
BEGIN
    ALTER DATABASE QLSVNhom SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QLSVNhom;
END
GO

CREATE DATABASE QLSVNhom;
GO

USE QLSVNhom;
GO

--b) Viết script tạo mới các Table SINHVIEN, NHANVIEN, LOP, HOCPHAN, BANGDIEM.
CREATE TABLE NHANVIEN (
    MANV VARCHAR(20) PRIMARY KEY,
    HOTEN NVARCHAR(100) NOT NULL,
    EMAIL VARCHAR(20),
    LUONG VARBINARY(MAX), -- Lưu trữ lương đã mã hóa RSA
    TENDN NVARCHAR(100) NOT NULL UNIQUE,
    MATKHAU VARBINARY(MAX) NOT NULL, -- Lưu trữ mật khẩu băm SHA1
    PUBKEY VARCHAR(20) -- Tên khóa công khai tương ứng với MANV
);

CREATE TABLE LOP (
    MALOP VARCHAR(20) PRIMARY KEY,
    TENLOP NVARCHAR(100) NOT NULL,
    MANV VARCHAR(20),
    CONSTRAINT FK_LOP_NHANVIEN FOREIGN KEY (MANV) REFERENCES NHANVIEN(MANV)
);

CREATE TABLE SINHVIEN (
    MASV VARCHAR(20) PRIMARY KEY,
    HOTEN NVARCHAR(100) NOT NULL,
    NGAYSINH DATETIME,
    DIACHI NVARCHAR(200),
    MALOP VARCHAR(20),
    TENDN NVARCHAR(100) NOT NULL UNIQUE,
    MATKHAU VARBINARY(MAX) NOT NULL,
    CONSTRAINT FK_SINHVIEN_LOP FOREIGN KEY (MALOP) REFERENCES LOP(MALOP)
);

CREATE TABLE HOCPHAN (
    MAHP VARCHAR(20) PRIMARY KEY,
    TENHP NVARCHAR(100) NOT NULL,
    SOTC INT
);

CREATE TABLE BANGDIEM (
    MASV VARCHAR(20),
    MAHP VARCHAR(20),
    DIEMTHI VARBINARY(MAX), -- Điểm thi được mã hóa
    PRIMARY KEY (MASV, MAHP),
    CONSTRAINT FK_BANGDIEM_SINHVIEN FOREIGN KEY (MASV) REFERENCES SINHVIEN(MASV),
    CONSTRAINT FK_BANGDIEM_HOCPHAN FOREIGN KEY (MAHP) REFERENCES HOCPHAN(MAHP)
);
GO

-- Câu c
-- i) Stored Procedure thêm nhân viên (SP_INS_PUBLIC_NHANVIEN)
USE QLSVNhom;
GO

CREATE OR ALTER PROCEDURE SP_INS_PUBLIC_NHANVIEN
    @MANV VARCHAR(20),
    @HOTEN NVARCHAR(100),
    @EMAIL VARCHAR(20),
    @LUONGCB INT,
    @TENDN NVARCHAR(100),
    @MK VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra dữ liệu đầu vào
    IF @MANV IS NULL OR @HOTEN IS NULL OR @TENDN IS NULL OR @MK IS NULL
    BEGIN
        RAISERROR(N'Các tham số không được để trống.', 16, 1);
        RETURN;
    END

    -- Kiểm tra trùng
    IF EXISTS (SELECT 1 FROM NHANVIEN WHERE MANV = @MANV OR TENDN = @TENDN)
    BEGIN
        RAISERROR(N'Mã nhân viên hoặc Tên đăng nhập đã tồn tại.', 16, 1);
        RETURN;
    END

    DECLARE @Sql NVARCHAR(MAX);
    DECLARE @LuongEncrypted VARBINARY(MAX);
    DECLARE @MatKhauHash VARBINARY(MAX);

    -- TẠO KHÓA: Chú ý thêm N''' để đảm bảo mật khẩu là kiểu NVARCHAR (Unicode)
	-- Microsoft đã loại bỏ hoàn toàn thuật toán RSA_512 ra khỏi hệ thống 
	-- bắt buộc bạn phải nâng chuẩn mã hóa lên RSA_2048 nếu không sẽ lỗi 
    IF NOT EXISTS (SELECT * FROM sys.asymmetric_keys WHERE name = @MANV)
    BEGIN
        SET @Sql = N'CREATE ASYMMETRIC KEY ' + QUOTENAME(@MANV) + 
                   N' WITH ALGORITHM = RSA_2048 ENCRYPTION BY PASSWORD = N''' 
                   + REPLACE(@MK, '''', '''''') + N'''';
        EXEC sp_executesql @Sql;
    END

    -- Mã hóa lương (Ép kiểu MANV sang NVARCHAR cho chắc chắn với hàm ASYMKEY_ID)
    SET @LuongEncrypted = ENCRYPTBYASYMKEY(ASYMKEY_ID(CAST(@MANV AS NVARCHAR(20))), CAST(@LUONGCB AS VARCHAR(50)));
    
    -- Hash mật khẩu
    SET @MatKhauHash = HASHBYTES('SHA1', @MK);

    -- Insert
    INSERT INTO NHANVIEN (MANV, HOTEN, EMAIL, LUONG, TENDN, MATKHAU, PUBKEY)
    VALUES (@MANV, @HOTEN, @EMAIL, @LuongEncrypted, @TENDN, @MatKhauHash, @MANV);

    PRINT N'Thêm nhân viên thành công!';
END
GO


-- ii) Stored dùng để truy vấn dữ liệu nhân viên (NHANVIEN)
CREATE OR ALTER PROCEDURE SP_SEL_PUBLIC_NHANVIEN
    @TENDN NVARCHAR(100),
    @MK VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- Mật khẩu giải mã bắt buộc là NVARCHAR
    DECLARE @MK_NVARCHAR NVARCHAR(100) = CAST(@MK AS NVARCHAR(100));

    SELECT 
        MANV,
        HOTEN,
        EMAIL,
        -- Giải mã và ép kiểu ngược lại thành INT
        CAST(
            CAST(DECRYPTBYASYMKEY(ASYMKEY_ID(CAST(PUBKEY AS NVARCHAR(20))), LUONG, @MK_NVARCHAR) AS VARCHAR(50)) 
        AS INT) AS LUONGCB
    FROM NHANVIEN
    WHERE TENDN = @TENDN 
      AND MATKHAU = HASHBYTES('SHA1', @MK);
END
GO


-- Test 

USE QLSVNhom;
GO

-- =======================================================
-- 1. Dọn dẹp dữ liệu cũ (nếu có) để tránh lỗi trùng lặp khi chạy test nhiều lần
-- =======================================================
IF EXISTS (SELECT 1 FROM NHANVIEN WHERE MANV = 'NV01')
BEGIN
    DELETE FROM NHANVIEN WHERE MANV = 'NV01';
    
    -- Xóa luôn Asymmetric Key cũ nếu đã tồn tại để tạo lại cái mới cho chuẩn
    IF EXISTS (SELECT * FROM sys.asymmetric_keys WHERE name = 'NV01')
    BEGIN
        DROP ASYMMETRIC KEY [NV01];
    END
END
GO

-- =======================================================
-- 2. TEST GỌI PROCEDURE INSERT (Thêm mới và Mã hóa)
-- =======================================================
PRINT N'---> ĐANG CHẠY SP INSERT...';
EXEC SP_INS_PUBLIC_NHANVIEN 
    @MANV = 'NV01', 
    @HOTEN = N'Nguyễn Văn A', 
    @EMAIL = 'nva@gmail.com', 
    @LUONGCB = 3000000, 
    @TENDN = N'NVA', 
    @MK = 'abcd12';
GO

-- =======================================================
-- 3. XEM THỰC TẾ DỮ LIỆU LƯU TRONG DATABASE 
-- (Để thấy Lương và Mật khẩu đã biến thành chuỗi byte mã hóa)
-- =======================================================
PRINT N'---> DỮ LIỆU ĐÃ BỊ MÃ HÓA TRONG BẢNG NHANVIEN:';
SELECT 
    MANV, 
    HOTEN, 
    LUONG AS [LUONG_Da_Ma_Hoa_RSA], 
    MATKHAU AS [MATKHAU_Da_Bam_SHA1], 
    PUBKEY 
FROM NHANVIEN 
WHERE MANV = 'NV01';
GO

-- =======================================================
-- 4. TEST GỌI PROCEDURE SELECT (Đăng nhập và Giải mã)
-- =======================================================
PRINT N'---> KẾT QUẢ GIẢI MÃ TỪ SP SELECT:';
-- Truyền đúng Tên đăng nhập và Mật khẩu
EXEC SP_SEL_PUBLIC_NHANVIEN 
    @TENDN = N'NVA', 
    @MK = 'abcd12'; 
GO