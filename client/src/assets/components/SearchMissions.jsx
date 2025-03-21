// SearchMissions.jsx
import { FormRow, FormRowSelect } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit } from "react-router-dom";
import { TYPEPOSTURES, MISSIONS_SORT_BY } from "../../utils/constants";
import { useAllPostureContext } from "../../pages/AllPosture";
import { debounce } from "../../utils/debounce";

const SearchMissions = () => {
  const { searchValues } = useAllPostureContext();
  const { search = "", missionType = "", sort = "" } = searchValues || {};
  const submit = useSubmit();

  return (
    <Wrapper>
      <Form className="form">
        <h4 className="form-title">ค้นหาและกรองข้อมูล</h4>
        <div className="form-center">
          <FormRow
            labelText="ค้นหา"
            type="search"
            name="search"
            defaultValue={search}
            onChange={debounce((form) => {
              console.log("Submitting search form:", form);
              submit(form);
            })}
          />

          <FormRowSelect
            labelText="ประเภทภารกิจ"
            name="missionType"
            list={["ทั้งหมด", ...Object.values(TYPEPOSTURES)]}
            defaultValue={missionType || "ทั้งหมด"}
            onChange={(e) => {
              console.log("Selected mission type:", e.target.value);
              submit(e.currentTarget.form);
            }}
          />

          <FormRowSelect
            labelText="เรียงลำดับ"
            name="sort"
            defaultValue={sort || "ใหม่ที่สุด"}
            list={[...Object.values(MISSIONS_SORT_BY)]}
            onChange={(e) => {
              console.log("Selected sort:", e.target.value);
              submit(e.currentTarget.form);
            }}
          />
        </div>
      </Form>
    </Wrapper>
  );
};

export default SearchMissions;
