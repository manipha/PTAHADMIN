import { FormRow, FormRowSelect } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit } from "react-router-dom";
import {
  TYPEPOSTURES,
  MISSIONS_SORT_BY,
} from "../../utils/constants";
import { useAllPostureContext } from "../../pages/AllPosture";
import { debounce } from "../../utils/debounce";

const SearchMissionContainer = () => {
  const { searchValues } = useAllPostureContext();
  // ให้ค่าเริ่มต้นเป็น object ว่างหรือค่าที่เหมาะสมหาก `searchValues` เป็น undefined
  const { search = "", missionType = "", sort = "" } = searchValues || {};
  const submit = useSubmit();

  // ฟังก์ชันตรวจสอบการส่งฟอร์ม
  const handleSearch = (form) => {
    console.log("Search form submitted with:", form);
    
    // ส่งฟอร์มไปยัง React Router DOM
    submit(form);
  };

  return (
    <Wrapper>
      <Form className="form">
        <div className="form-center">
          <FormRow
            labelText="ค้นหา"
            type="search"
            name="search"
            defaultValue={search}
            onChange={debounce((form) => {
              handleSearch(form);
            }, 500)} // ลดเวลา debounce ลงเพื่อการตอบสนองที่เร็วขึ้น
          />

          <FormRowSelect
            labelText="ประเภทภารกิจ"
            name="missionType"
            list={["ทั้งหมด", ...Object.values(TYPEPOSTURES)]}
            defaultValue={missionType || "ทั้งหมด"}
            onChange={(e) => {
              console.log("Mission type selected:", e.target.value);
              submit(e.currentTarget.form);
            }}
          />

          <FormRowSelect
            labelText="เรียงลำดับ"
            name="sort"
            defaultValue={sort || "ใหม่ที่สุด"} 
            list={[...Object.values(MISSIONS_SORT_BY)]}
            onChange={(e) => {
              console.log("Sort selected:", e.target.value);
              submit(e.currentTarget.form);
            }}
          />
        </div>
      </Form>
    </Wrapper>
  );
};

export default SearchMissionContainer; 