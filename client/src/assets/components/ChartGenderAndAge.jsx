import React, { useState } from "react";
import { BarChart, LineChart } from "@mui/x-charts"; // ใช้ LineChart แทน AreaChart
import Wrapper from "../wrappers/ChartsContainer";

const ChartGenderAndAge = ({ data, title }) => {
  const [useBarChart, setUseBarChart] = useState(true);

  const ageRanges = ["0-19", "20-39", "40-59", "60-79", "80+"];

  const maleData = data.filter((item) => item.gender === "ชาย");
  const femaleData = data.filter((item) => item.gender === "หญิง");

  const maleSeriesData = ageRanges.map((range) => {
    const found = maleData.find((item) => item.ageRange === range);
    return found ? found.count : 0;
  });

  const femaleSeriesData = ageRanges.map((range) => {
    const found = femaleData.find((item) => item.ageRange === range);
    return found ? found.count : 0;
  });

  const chartProps = {
    xAxis: [{ scaleType: "band", data: ageRanges }],
    series: [
      { data: maleSeriesData, name: "ชาย" },
      { data: femaleSeriesData, name: "หญิง" },
    ],
    width: 500,
    height: 300,
  };

  return (
    <Wrapper>
      <h4>{title}</h4>
      <button type="button" onClick={() => setUseBarChart((prev) => !prev)}>
        {useBarChart ? "Switch to Area Chart" : "Switch to Bar Chart"}
      </button>
      {useBarChart ? (
        <BarChart {...chartProps} />
      ) : (
        // ลองใช้ LineChart แทน AreaChart
        <LineChart {...chartProps} />
      )}
    </Wrapper>
  );
};

export default ChartGenderAndAge;
