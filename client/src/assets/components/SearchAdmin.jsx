import { FormRow, FormRowSelect, SubmitBtn } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit, Link } from "react-router-dom";
import {
  POSTURES_SORT_BY,
} from "../../utils/constants";
import { useAllAdminContext } from "../../pages/AllAdmin";
import { debounce } from "../../utils/debounce";

const SearchAdmin = () => {
  const { searchValues } = useAllAdminContext();
  // ให้ค่าเริ่มต้นเป็น object ว่างหรือค่าที่เหมาะสมหาก `searchValues` เป็น undefined
  const { search = "", sort = "" } = searchValues || {};
  const submit = useSubmit();

  return (
    <Wrapper>
      <Form className="form">
        <div className="form-center">
          <FormRow
            labelText="ค้นหาชื่อ"
            type="search"
            name="search"
            defaultValue={search}
            onChange={debounce((form) => {
              submit(form);
            })}
          />

          <FormRowSelect
            labelText="เรียงลำดับ"
            name="sort"
            defaultValue={sort}
            list={[...Object.values(POSTURES_SORT_BY)]}
            onChange={(e) => {
              submit(e.currentTarget.form);
            }}
          />
        </div>
      </Form>
    </Wrapper>
  );
};
export default SearchAdmin;
