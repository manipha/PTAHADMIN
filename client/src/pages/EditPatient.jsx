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

// Loader ดึงข้อมูล patient และถ้ามีข้อมูล caregiver อยู่แล้วให้ merge ลงไปด้วย
export const loader = async ({ params }) => {
  console.log("📌 Loading patient with ID:", params._id);
  try {
    const { _id } = params;
    if (!_id) throw new Error("Invalid ID");

    // ดึงข้อมูล patient จาก API
    const { data: patientData } = await customFetch.get(`/allusers/${_id}`);

    // ถ้าผู้ป่วยเลือกว่ามีผู้ดูแล (TYPE_CGV1) และมี ID_card_number
    if (
      patientData.youhaveCaregiver === HAVECAREGIVER.TYPE_CGV1 &&
      patientData.ID_card_number
    ) {
      const { data: caregiverResponse } = await customFetch.get(
        `/caregiver/${patientData.ID_card_number}`
      );
      if (
        caregiverResponse &&
        caregiverResponse.status === "Ok" &&
        caregiverResponse.caregiver
      ) {
        // Merge ข้อมูลผู้ดูแลลงใน patientData รวมถึง caregiver _id ด้วย
        patientData.ID_card_number =
          caregiverResponse.caregiver.ID_card_number;
        patientData.name = caregiverResponse.caregiver.name;
        patientData.surname = caregiverResponse.caregiver.surname;
        patientData.tel = caregiverResponse.caregiver.tel;
        if (
          caregiverResponse.caregiver.userRelationships &&
          caregiverResponse.caregiver.userRelationships.length > 0
        ) {
          patientData.userRelationships =
            caregiverResponse.caregiver.userRelationships[0].relationship;
        }
        // เก็บ caregiver _id เพื่อใช้ในการ update ใน action
        patientData.caregiverId = caregiverResponse.caregiver._id;
      }
    }
    return patientData;
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

  data.physicalTherapy = data.physicalTherapy === "true";

  console.log("📌 _id:", _id);
  console.log("🚀 Data sent to API:", data);

  try {
    if (!_id) throw new Error("Invalid ID");
    // อัปเดตข้อมูล patient
    await customFetch.patch(`/allusers/${_id}`, data);

    // ถ้าเลือกว่ามีผู้ดูแล (TYPE_CGV1) ให้ส่งข้อมูลผู้ดูแลไปยัง API ของ caregiver
    if (data.youhaveCaregiver === HAVECAREGIVER.TYPE_CGV1) {
      const caregiverPayload = {
        ID_card_number: data.ID_card_number,
        name: data.name,
        surname: data.surname,
        tel: data.tel,
        Relationship: data.userRelationships,
        user: data.user, // สมมติว่า field นี้มาจากข้อมูลผู้ใช้งาน
      };

      if (data.caregiverId) {
        await customFetch.patch(`/caregiver/${data.caregiverId}`, caregiverPayload);
      } else {
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
  const [selectedUserType, setSelectedUserType] = useState(
    patient.userType || ""
  );
  const [selectedUserPosts, setSelectedUserPosts] = useState(
    patient.userPosts || []
  );
  const [selectedUserStatus, setSelectedUserStatus] = useState(
    patient.userStatus || ""
  );
  const [postures, setPostures] = useState([]);
  // Initialize birthday with formatted date
  const [birthday, setBirthday] = useState(formatBirthday(patient.birthday));

  // State สำหรับข้อมูลผู้ดูแล
  // หากมี caregiver อยู่แล้ว ให้ใช้ข้อมูลนั้น หากไม่มี ให้ใช้ค่าใน patient.youhaveCaregiver หรือ prompt
  const initialHaveCaregiver = caregiver
    ? HAVECAREGIVER.TYPE_CGV1
    : patient.youhaveCaregiver || "โปรดเลือกว่ามีผู้ดูแลหรือไม่?";
  const [selectedYouhaveCaregiver, setSelectedYouhaveCaregiver] = useState(initialHaveCaregiver);
  const [caregiverIDCard, setCaregiverIDCard] = useState(caregiver?.ID_card_number || "");
  const [caregiverName, setCaregiverName] = useState(caregiver?.name || "");
  const [caregiverSurname, setCaregiverSurname] = useState(caregiver?.surname || "");
  const [caregiverTel, setCaregiverTel] = useState(caregiver?.tel || "");
  const [caregiverRelationship, setCaregiverRelationship] = useState(
    caregiver?.userRelationships?.[0]?.relationship || ""
  );

  const [patientData, setPatientData] = useState({
    ...patient, // โหลดข้อมูลจาก `patient`
    physicalTherapy: patient.physicalTherapy, // ค่าเริ่มต้น
  });
  // Handler สำหรับข้อมูลผู้ดูแล
  const handleYouhaveCaregiverChange = (event) => {
    setSelectedYouhaveCaregiver(event.target.value);
  };

  const handleCaregiverRelationshipChange = (event) => {
    setSelectedCaregiverRelationship(event.target.value);
  };

  useEffect(() => {
    const fetchPostures = async () => {
      try {
        const { data } = await customFetch.get("/postures");
        setPostures(data.postures);
      } catch (error) {
        toast.error(error?.response?.data?.msg);
      }
    };
    fetchPostures();
  }, []);

  const handleUserTypeChange = (event) => {
    setSelectedgender(event.target.value);
    setSelectedUserType(event.target.value);
    setSelectedUserStatus(event.target.value);
    setSelectedYouhaveCaregiver(event.target.value);
  };

  const handleBirthdayChange = (event) => {
    console.log("Birthday changed to:", event.target.value);
    setBirthday(event.target.value);
  };

  const handleUserPostsChange = (selectedOptions) => {
    setSelectedUserPosts(selectedOptions.map((option) => option.value));
  };

  const handleRelationChange = (event) => {
    setSelectedRelation(event.target.value);
  };

  const handleOtherRelationChange = (event) => {
    setOtherRelation(event.target.value);
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

          {patient.caregiverId && (
            <input type="hidden" name="caregiverId" value={patient.caregiverId} />
          )}

          <input type="hidden" name="user" value={patient.user || "defaultUserId"} />



          <FormRow
            type="text"
            name="ID_card_number"
            labelText="หมายเลขบัตรประชาชน"
            pattern="[0-9]*"
            defaultValue={patient.ID_card_number}
          />

          <div className="row">
            <div className="column1">
              {/* <FormRow
                type="text"
                name="idPatient"
                labelText="หมายเลขผู้ป่วย"
                pattern="[0-9]*"
                defaultValue={patient.idPatient}
              /> */}
              <FormRow
                type="text"
                name="name"
                labelText="ชื่อผู้ป่วย"
                defaultValue={patient.name}
              />
              {/* <FormRow
                type="text"
                name="sickness"
                labelText="โรคหรืออาการของผู้ป่วย"
                defaultValue={patient.sickness}
              /> */}
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

          {/* <FormRowMultiSelect
            name="userPosts"
            labelText="เลือกท่ากายภาพบำบัด"
            value={selectedUserPosts}
            options={["ท่าทั้งหมด", ...postures.map((p) => p.namePostures)]}
            defaultValue={patient.userPosts}
            onChange={handleUserPostsChange}
          /> */}

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
                    value={caregiver?.userRelationships?.[0]?.relationship || ""}
                    onChange={handleCaregiverRelationshipChange}
                    list={Object.values(RELATIONS)}
                    defaultValue={caregiver?.userRelationships?.[0]?.relationship || ""}
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
