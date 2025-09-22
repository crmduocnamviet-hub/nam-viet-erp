import React from 'react';

const MissingDocumentationWarning: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    padding: '20px',
    border: '1px solid #ffccc7',
    backgroundColor: '#fff2f0',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '20px auto',
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    color: '#cf1322',
    margin: '0 0 10px 0',
    fontSize: '1.2em',
    fontWeight: 'bold',
  };

  const descriptionStyle: React.CSSProperties = {
    color: '#595959',
    fontSize: '1em',
    lineHeight: '1.5',
  };

  const listStyle: React.CSSProperties = {
    listStyleType: 'none',
    padding: 0,
    marginTop: '15px',
    color: '#8c8c8c',
  };

  const listItemStyle: React.CSSProperties = {
    marginBottom: '5px',
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Lỗi: Không tìm thấy tài liệu nghiệp vụ</h3>
      <p style={descriptionStyle}>
        Vui lòng cung cấp tài liệu nghiệp vụ bạn muốn phân tích để tôi có thể chuyển đổi thành định dạng JSON mong muốn. Hiện tại, không có dữ liệu để xử lý.
      </p>
      <ul style={listStyle}>
        <li style={listItemStyle}>- Trạng thái: Chờ cung cấp tài liệu</li>
        <li style={listItemStyle}>- Trạng thái: Không có dữ liệu đầu vào</li>
      </ul>
    </div>
  );
};

export default MissingDocumentationWarning;