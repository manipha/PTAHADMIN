import { FormRow, FormRowSelect, SubmitBtn } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit, Link } from "react-router-dom";
import {
  TYPEPOSTURES,
  TYPESTATUS,
  POSTURES_SORT_BY,
} from "../../utils/constants";
import { useAllPatientContext } from "../../pages/AllPatient";
import { debounce } from "../../utils/debounce";

const SearchContainer = () => {
  const { searchValues } = useAllPatientContext();
  const { search = "", userStatus = "", sort = "" } = searchValues || {};
  const submit = useSubmit();

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
              submit(form);
            })}
          />

          <FormRowSelect
            labelText="สถานะของผู้ป่วย"
            name="userStatus"
            list={["ทั้งหมด", ...Object.values(TYPESTATUS)]}
            defaultValue={userStatus}
            onChange={(e) => {
              submit(e.currentTarget.form);
            }}
          />

          {/* <FormRowSelect
            labelText="ชื่อประเภทของท่า"
            name="userType"
            list={["all", ...Object.values(TYPEPOSTURES)]}
            defaultValue={userType}
            onChange={(e) => {
              submit(e.currentTarget.form);
            }}
          /> */}

          <FormRowSelect
            labelText="เรียงลำดับ"
            name="sort"
            defaultValue={sort}
            list={[...Object.values(POSTURES_SORT_BY)]}
            onChange={(e) => {
              submit(e.currentTarget.form);
            }}
          />
          {/* <Link to="/dashboard/all-patient" className="btn form-btn delete-btn">
            Reset Search Values
          </Link> */}
        </div>
      </Form>
    </Wrapper>
  );
};
export default SearchContainer;
