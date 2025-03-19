import { FormRow, FormRowSelect, SubmitBtn } from ".";
import Wrapper from "../wrappers/SearchContainer";
import { Form, useSubmit, Link } from "react-router-dom";
import {
  PREFIXDOCTOR,
  POSTURES_SORT_BY,
} from "../../utils/constants";
import { useAllDoctorContext } from "../../pages/AllDoctor";
import { debounce } from "../../utils/debounce";
import { useState, useEffect } from "react";

const SearchMPersonnel = () => {
  const { searchValues } = useAllDoctorContext();
  // ให้ค่าเริ่มต้นเป็น object ว่างหรือค่าที่เหมาะสมหาก `searchValues` เป็น undefined
  const { search = "", nametitle = "", sort = "" } = searchValues || {};
  const submit = useSubmit();

  // Handle search input changes with debounce
  const handleSearchChange = debounce((form) => {
    console.log("Doctor search changed, submitting form");
    const formData = new FormData(form);
    
    // Debug FormData contents for search
    console.log("Form data for search:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    submit(formData, { method: 'get' });
  });

  // Handle nametitle changes
  const handleNameTitleChange = (e) => {
    const form = e.currentTarget.form;
    const selectedTitle = e.target.value;
    
    console.log("Name title changed to:", selectedTitle);
    
    // Create new form data with updated title
    const formData = new FormData(form);
    formData.set('nametitle', selectedTitle);
    
    // Debug FormData contents
    console.log("Form data before submission:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Submit the form with the new data
    submit(formData, { method: 'get' });
  };

  // Log current search values for debugging
  useEffect(() => {
    console.log("Current doctor search filters:", { search, nametitle, sort });
  }, [search, nametitle, sort]);

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
            labelText="คำนำหน้าชื่อ"
            name="nametitle"
            list={["ทั้งหมด", ...Object.values(PREFIXDOCTOR)]}
            defaultValue={nametitle}
            onChange={handleNameTitleChange}
          />

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
export default SearchMPersonnel;