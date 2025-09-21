import React from 'react';
import { Calendar, Badge, Card, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;

const getListData = (value: Dayjs) => {
  let listData;
  switch (value.date()) {
    case 8:
      listData = [
        { type: 'warning', content: 'Chiến dịch "Back to School" bắt đầu.' },
        { type: 'success', content: 'Gửi email cho phân khúc "Sinh viên".' },
      ];
      break;
    case 10:
      listData = [
        { type: 'warning', content: 'Chiến dịch "Black Friday" bắt đầu.' },
        { type: 'processing', content: 'Gửi SMS cho toàn bộ khách hàng.' },
      ];
      break;
    case 15:
      listData = [
        { type: 'error', content: 'Chiến dịch "Back to School" kết thúc.' },
      ];
      break;
    default:
  }
  return listData || [];
};

const CampaignCalendar: React.FC = () => {
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type as any} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
        <Title level={4}>Lịch Chiến dịch</Title>
        <Calendar dateCellRender={dateCellRender} />
    </Card>
  );
};

export default CampaignCalendar;
