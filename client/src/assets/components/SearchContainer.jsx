import { FormRow, FormRowSelect, SubmitBtn } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit, Link, useNavigate } from "react-router-dom";
import {
  TYPEPOSTURES,
  TYPESTATUS,
  POSTURES_SORT_BY,
} from "../../utils/constants";
import { useAllPatientContext } from "../../pages/AllPatient";
import { debounce } from "../../utils/debounce";
import { useEffect, useState } from "react";

const SearchContainer = () => {
  const { searchValues } = useAllPatientContext();
  const { search = "", userStatus = "", sort = "" } = searchValues || {};
  const submit = useSubmit();
  const navigate = useNavigate();

  // Debug state - logs values for troubleshooting
  const [debug, setDebug] = useState({
    currentStatus: userStatus,
    statusOptions: ["ทั้งหมด", ...Object.values(TYPESTATUS)]
  });

  // Handle status change with direct submission
  const handleStatusChange = (e) => {
    const form = e.currentTarget.form;
    const selectedStatus = e.target.value;
    
    console.log("Status changed to:", selectedStatus);
    
    // Create new form data with updated status
    const formData = new FormData(form);
    formData.set('userStatus', selectedStatus);
    
    // Debug FormData contents
    console.log("Form data before submission:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Update debug state
    setDebug(prev => ({...prev, currentStatus: selectedStatus}));
    
    // Submit the form with the new data
    console.log("Submitting form with userStatus:", selectedStatus);
    submit(formData, { method: 'get' });
  };

  // Submit all form data when search changes
  const handleSearchChange = debounce((form) => {
    console.log("Search changed, submitting form");
    const formData = new FormData(form);
    
    // Debug FormData contents for search
    console.log("Form data for search:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    submit(formData, { method: 'get' });
  });

  // Log current filter state for debugging
  useEffect(() => {
    console.log("Current filters:", { search, userStatus, sort });
    console.log("Debug state:", debug);
    console.log("TYPESTATUS values:", Object.values(TYPESTATUS));
  }, [search, userStatus, sort, debug]);

  return (
    <Wrapper>
      <Form className="form" method="get">
        <div className="form-center">
          <FormRow
            labelText="ค้นหา"
            type="search"
            name="search"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.currentTarget.form)}
          />

          <FormRowSelect
            labelText="สถานะของผู้ป่วย"
            name="userStatus"
            list={["ทั้งหมด", ...Object.values(TYPESTATUS)]}
            defaultValue={userStatus}
            onChange={handleStatusChange}
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
              console.log("Sort changed to:", e.target.value);
              submit(e.currentTarget.form, { method: 'get' });
            }}
          />
        </div>
      </Form>
    </Wrapper>
  );
};

export default SearchContainer;
