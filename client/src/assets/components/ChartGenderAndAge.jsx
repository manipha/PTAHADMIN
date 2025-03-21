import React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Wrapper from "../wrappers/ChartsContainer";

const ChartGenderAndAge = ({ data, title }) => {
  // สร้างอาร์เรย์ของช่วงอายุที่ไม่ซ้ำและเรียงลำดับ
  const ageRanges = Array.from(new Set(data.map(item => item.ageRange))).sort();

  // รวมข้อมูลในรูปแบบที่ Recharts ต้องการ
  // ผลลัพธ์จะมีรูปแบบ: [{ ageRange: '0-19', ชาย: 10, หญิง: 5 }, ... ]
  const chartData = ageRanges.map(range => {
    const maleEntry = data.find(item => item.gender === "ชาย" && item.ageRange === range);
    const femaleEntry = data.find(item => item.gender === "หญิง" && item.ageRange === range);
    return {
      ageRange: range,
      ชาย: maleEntry ? maleEntry.count : 0,
      หญิง: femaleEntry ? femaleEntry.count : 0,
    };
  });

  return (
    <Wrapper>
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* แกน X แสดงช่วงอายุ */}
          <XAxis dataKey="ageRange" />
          {/* ซ่อนแกน Y ที่แสดงตัวเลข */}
          <YAxis hide={true} />
          <Tooltip />
          <Legend />
          <Bar dataKey="ชาย" fill="#67aeff" />
          <Bar dataKey="หญิง" fill="#ff80d9" />
        </BarChart>
      </ResponsiveContainer>
    </Wrapper>
  );
};

export default ChartGenderAndAge;
