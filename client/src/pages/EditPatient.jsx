import React, { useState, useEffect } from "react";
import {
  FormRow,
  FormRowSelect,
  FormRowMultiSelect,
  FormRowRadio,
} from "../assets/components";
import Wrapper from "../assets/wrappers/DashboardFormPage";
import { useLoaderData, useParams } from "react-router-dom";
import {
  TYPEPOSTURES,
  CHOOSEPOSTURES,
  TYPESTATUS,
  GENDER,
  RELATIONS,
  HAVECAREGIVER,
} from "../../../server/utils/constants";
import { Form, useNavigate, redirect } from "react-router-dom";
import { toast } from "react-toastify";
import customFetch from "../utils/customFetch";

// Loader ดึงข้อมูล patient และถ้ามีข้อมูล caregiver ให้ดึงมาแสดงด้วย
export const loader = async ({ params }) => {
  console.log("📌 Loading patient with ID:", params._id);
  try {
    const { _id } = params;
    if (!_id) throw new Error("Invalid ID");

    // ดึงข้อมูล patient จาก API
    const { data: patientData } = await customFetch.get(`/allusers/${_id}`);
    
    // เตรียมข้อมูลผลลัพธ์
    const result = { patient: patientData, caregiver: null };

    // ถ้าผู้ป่วยมีหมายเลขบัตรประชาชน ให้ดึงข้อมูลผู้ดูแล (ถ้ามี)
    if (patientData.ID_card_number) {
      try {
        // ดึงข้อมูลผู้ดูแลโดยใช้ ID ของคนไข้
        const { data: caregiverResponse } = await customFetch.get(`/caregiver/patient/${_id}`);
        
        if (caregiverResponse && caregiverResponse.status === "Ok" && caregiverResponse.caregiver) {
          result.caregiver = caregiverResponse.caregiver;
          // ถ้ามีข้อมูลผู้ดูแล ให้ตั้งค่า youhaveCaregiver เป็น TYPE_CGV1 (มีผู้ดูแล)
          result.patient.youhaveCaregiver = HAVECAREGIVER.TYPE_CGV1;
        }
      } catch (error) {
        console.log("No caregiver found for this patient, but it's OK");
        // ถ้าไม่มีข้อมูลผู้ดูแล ไม่ต้องทำอะไร
      }
    }

    console.log("Loader result:", result);
    return result;
  } catch (error) {
    toast.error(error.response?.data?.msg);
    return redirect("/dashboard/all-patient");
  }
};

// Action สำหรับอัปเดตข้อมูล patient และ caregiver (ถ้ามี)
export const action = async ({ request, params }) => {
  const { _id } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // แปลงค่า Boolean
  data.physicalTherapy = data.physicalTherapy === "true";

  console.log("📌 _id:", _id);
  console.log("🚀 Data sent to API:", data);

  try {
    if (!_id) throw new Error("Invalid ID");
    
    // สร้าง payload สำหรับอัปเดตข้อมูล patient
    const patientPayload = {
      name: data.name,
      surname: data.surname,
      email: data.email,
      tel: data.tel,
      gender: data.gender,
      birthday: data.birthday,
      ID_card_number: data.ID_card_number,
      Address: data.Address,
      userStatus: data.userStatus,
      physicalTherapy: data.physicalTherapy,
      youhaveCaregiver: data.youhaveCaregiver,
      nationality: data.nationality,
      username: data.username
    };

    // อัปเดตข้อมูล patient
    await customFetch.patch(`/allusers/${_id}`, patientPayload);

    // ถ้าเลือกว่ามีผู้ดูแล (TYPE_CGV1) ให้สร้างหรืออัปเดตข้อมูลผู้ดูแล
    if (data.youhaveCaregiver === HAVECAREGIVER.TYPE_CGV1) {
      // สร้าง payload สำหรับผู้ดูแล
      const caregiverPayload = {
        // ส่งค่าข้อมูลตามที่ backend รองรับ (ใช้ชื่อฟิลด์ที่มี prefix "caregiver")
        caregiverID_card_number: data.caregiverID_card_number,
        caregiverName: data.caregiverName,
        caregiverSurname: data.caregiverSurname,
        caregiverTel: data.caregiverTel,
        caregiverRelationship: data.caregiverRelationship,
        user: _id, // ID ของผู้ป่วย
      };

      console.log("Caregiver payload:", caregiverPayload);

      if (data.caregiverId) {
        // ถ้ามี caregiverId แสดงว่าผู้ดูแลมีอยู่แล้ว ให้อัปเดต
        await customFetch.patch(`/caregiver/${data.caregiverId}`, caregiverPayload);
      } else {
        // ถ้าไม่มี caregiverId แสดงว่าต้องสร้างผู้ดูแลใหม่
        await customFetch.post(`/caregiver`, caregiverPayload);
      }
    }

    toast.success("แก้ไขข้อมูลคนไข้และผู้ดูแลเรียบร้อยแล้ว");
    return redirect("/dashboard/all-patient");
  } catch (error) {
    toast.error(error?.response?.data?.msg);
    return error;
  }
};


const EditPatient = () => {
  const { patient, caregiver } = useLoaderData();

  // Format the birthday for the date input (YYYY-MM-DD format)
  const formatBirthday = (dateString) => {
    if (!dateString) return "";

    try {
      // Try to parse the date and format it as YYYY-MM-DD
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ""; // Invalid date

      // Format as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      console.log("Original birthday:", dateString);
      console.log("Formatted birthday:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Error formatting birthday:", error);
      return "";
    }
  };

  const navigation = useNavigate();
  const isSubmitting = navigation.state === "submitting";
  const [selectedgender, setSelectedgender] = useState(
    patient.gender || ""
  );
  const [selectedUserStatus, setSelectedUserStatus] = useState(
    patient.userStatus || ""
  );
  const [selectedYouhaveCaregiver, setSelectedYouhaveCaregiver] = useState(
    patient.youhaveCaregiver || (caregiver ? HAVECAREGIVER.TYPE_CGV1 : "")
  );
  const [selectedCaregiverRelationship, setSelectedCaregiverRelationship] = useState(
    caregiver?.userRelationships?.find(rel => rel.user === patient._id)?.relationship || ""
  );
  
  // Initialize birthday with formatted date
  const [birthday, setBirthday] = useState(formatBirthday(patient.birthday));

  const [patientData, setPatientData] = useState({
    ...patient,
    physicalTherapy: patient.physicalTherapy,
  });

  // Handler สำหรับข้อมูลผู้ดูแล
  const handleYouhaveCaregiverChange = (event) => {
    setSelectedYouhaveCaregiver(event.target.value);
  };

  const handleCaregiverRelationshipChange = (event) => {
    setSelectedCaregiverRelationship(event.target.value);
  };

  const handleUserTypeChange = (event) => {
    setSelectedgender(event.target.value);
  };

  const handleBirthdayChange = (event) => {
    console.log("Birthday changed to:", event.target.value);
    setBirthday(event.target.value);
  };

  const handleUserStatusChange = (event) => {
    const newStatus = event.target.value;
    setSelectedUserStatus(newStatus);

    // ถ้า userStatus เป็น "จบการรักษา" ให้ตั้ง physicalTherapy เป็น false
    setPatientData((prevData) => ({
      ...prevData,
      userStatus: newStatus,
      physicalTherapy: newStatus === TYPESTATUS.TYPE_ST2 ? false : true,
    }));
  };

  return (
    <Wrapper>
      <Form method="post" className="form">
        <h4 className="form-title">แก้ไขข้อมูลคนไข้</h4>
        <div className="form-center">
          {/* Hidden input เพื่อให้แน่ใจว่า birthday ถูกส่งไป */}
          <input type="hidden" name="birthday" value={birthday} />

          <input type="hidden" name="physicalTherapy" value={patientData.physicalTherapy ? "true" : "false"} />

          {caregiver && (
            <input type="hidden" name="caregiverId" value={caregiver._id} />
          )}

          <input type="hidden" name="user" value={patient._id} />

          <FormRow
            type="text"
            name="ID_card_number"
            labelText="หมายเลขบัตรประชาชน"
            pattern="[0-9]*"
            defaultValue={patient.ID_card_number}
          />

          <div className="row">
            <div className="column1">
              <FormRow
                type="text"
                name="name"
                labelText="ชื่อผู้ป่วย"
                defaultValue={patient.name}
              />
              <FormRowSelect
                labelText="เพศ"
                name="gender"
                value={selectedgender}
                onChange={handleUserTypeChange}
                list={Object.values(GENDER)}
                defaultValue={patient.gender}
              />
              <FormRow
                type="text"
                name="email"
                labelText="อีเมล"
                defaultValue={patient.email}
              />
              <FormRow
                type="text"
                name="nationality"
                labelText="สัญชาติ"
                defaultValue={patient.nationality}
              />
              <FormRow
                type="text"
                name="tel"
                labelText="เบอร์โทร"
                defaultValue={patient.tel}
              />
            </div>

            <div className="column2">
              <FormRow
                type="text"
                name="username"
                labelText="ชื่อผู้ใช้"
                defaultValue={patient.username}
              />
              <FormRow
                type="text"
                name="surname"
                labelText="นามสกุลผู้ป่วย"
                defaultValue={patient.surname}
              />

              <FormRowSelect
                labelText="เลือกสถานะปัจจุบันของคนไข้"
                name="userStatus"
                value={selectedUserStatus}
                onChange={handleUserStatusChange}
                list={Object.values(TYPESTATUS)}
                defaultValue={patient.userStatus}
              />

              <FormRow
                type="date"
                name="birthdayDisplay"
                labelText="วันเกิด"
                value={birthday}
                onChange={handleBirthdayChange}
              />
              <FormRow
                type="text"
                name="Address"
                labelText="ที่อยู่"
                defaultValue={patient.Address}
              />
            </div>
          </div>

          <hr />
          <br />

          <br />
          {/* ส่วนแก้ไขข้อมูลผู้ดูแล */}
          <h4 className="form-title">แก้ไขข้อมูลผู้ดูแล</h4>
          <div className="form-center">
            <FormRowSelect
              labelText="มีผู้ดูแลหรือไม่?"
              name="youhaveCaregiver"
              value={selectedYouhaveCaregiver}
              onChange={handleYouhaveCaregiverChange}
              list={[
                "โปรดเลือกว่ามีผู้ดูแลหรือไม่?",
                ...Object.values(HAVECAREGIVER),
              ]}
              defaultValue={selectedYouhaveCaregiver}
            />

            {selectedYouhaveCaregiver === HAVECAREGIVER.TYPE_CGV1 && (
              <div className="row">
                <div className="column1">
                  <FormRow
                    type="text"
                    name="caregiverID_card_number"
                    labelText="หมายเลขบัตรประชาชน (ผู้ดูแล)"
                    defaultValue={caregiver?.ID_card_number || ""}
                  />
                  <FormRow
                    type="text"
                    name="caregiverName"
                    labelText="ชื่อ (ผู้ดูแล)"
                    defaultValue={caregiver?.name || ""}
                  />
                  <FormRow
                    type="text"
                    name="caregiverSurname"
                    labelText="นามสกุล (ผู้ดูแล)"
                    defaultValue={caregiver?.surname || ""}
                  />
                  <FormRow
                    type="tel"
                    name="caregiverTel"
                    labelText="เบอร์โทรศัพท์ (ผู้ดูแล)"
                    defaultValue={caregiver?.tel || ""}
                  />
                  <FormRowSelect
                    labelText="ความสัมพันธ์"
                    name="caregiverRelationship"
                    value={selectedCaregiverRelationship}
                    onChange={handleCaregiverRelationshipChange}
                    list={Object.values(RELATIONS)}
                    defaultValue={selectedCaregiverRelationship}
                  />
                </div>
              </div>
            )}
          </div>

          {/* <br /> */}
          <button
            type="submit"
            className="btn btn-block form-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก" : "บันทึก"}
          </button>

        </div>
      </Form>
    </Wrapper>
  );
};
export default EditPatient;
