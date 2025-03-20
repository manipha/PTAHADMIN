import { useState } from "react";

import BarChart from "./BarChart";
import AreaChart from "./AreaChart";
import Wrapper from "../wrappers/ChartsContainer";

const ChartGenderAndAge = ({ data, title }) => {
  const [barChart, setBarChart] = useState(true);

  // กรองข้อมูลสำหรับเพศชายและเพศหญิง
  const maleData = data.filter(item => item.gender === "ชาย");
  const femaleData = data.filter(item => item.gender === "หญิง");

  return (
    <Wrapper>
      <h4>{title}</h4>
      <button type="button" onClick={() => setBarChart(!barChart)}>
        {barChart ? "Bar Chart" : "Area Chart"}
      </button>
      <div style={{ marginTop: "1rem" }}>
        <h5>ข้อมูลเพศชาย (ตามช่วงอายุ)</h5>
        {barChart ? <BarChart data={maleData} /> : <AreaChart data={maleData} />}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h5>ข้อมูลเพศหญิง (ตามช่วงอายุ)</h5>
        {barChart ? <BarChart data={femaleData} /> : <AreaChart data={femaleData} />}
      </div>
    </Wrapper>
  );
};

export default ChartGenderAndAge;
