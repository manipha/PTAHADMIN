import React, { useState, useEffect } from "react";
import {
  FormRow,
  FormRowSelect,
  FormRowMultiSelect,
  FormRowRadio,
} from "../assets/components";
import FormRowSelectWithCustom from "../assets/components/FormRowSelectWithCustom";
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
// ยกเลิกการใช้งาน dayjs ในส่วนนี้ (ถ้าไม่ต้องการใช้อีกต่อไป)
// import day from "dayjs";

// ฟังก์ชันสำหรับฟอร์แมตวันที่เป็นภาษาไทยโดยใช้ Intl.DateTimeFormat
const formatDateThai = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const loader = async ({ params }) => {
  console.log("📌 Loading patient with ID:", params._id);
  try {
    const { _id } = params;
    if (!_id) throw new Error("Invalid ID");

    console.log("Fetching patient data from:", `/allusers/${_id}`);
    const patientResponse = await customFetch.get(`/allusers/${_id}`);
    console.log("Patient API response:", patientResponse.data);

    if (!patientResponse.data || !patientResponse.data.patient) {
      console.error("API returned unexpected data structure:", patientResponse.data);
      throw new Error("Invalid API response format");
    }

    const patientData = patientResponse.data.patient;
    console.log("Patient data loaded:", patientData);

    const result = { patient: patientData, caregiver: null };

    console.log("Checking for caregiver data...");
    try {
      const caregiverEndpoint = `/caregiver/patient/${_id}`;
      console.log("Fetching caregiver data from:", caregiverEndpoint);
      const caregiverResponse = await customFetch.get(caregiverEndpoint);
      console.log("Caregiver API raw response:", caregiverResponse);
      console.log("Caregiver API response data:", caregiverResponse.data);

      if (
        caregiverResponse.data &&
        caregiverResponse.data.status === "Ok" &&
        caregiverResponse.data.caregiver
      ) {
        result.caregiver = caregiverResponse.data.caregiver;
        console.log("Caregiver data loaded:", result.caregiver);
        result.patient.youhaveCaregiver = HAVECAREGIVER.TYPE_CGV1;
      } else {
        console.log("No caregiver data in response or invalid format");
      }
    } catch (error) {
      console.error("Error fetching caregiver data:", error);
      console.log("Error response:", error.response?.data);
    }

    console.log("Final loader result:", result);
    return result;
  } catch (error) {
    console.error("Error loading patient data:", error);
    toast.error(error?.response?.data?.msg || "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
    return redirect("/dashboard/all-patient");
  }
};

export const action = async ({ request, params }) => {
  const { _id } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // แปลงค่า Boolean สำหรับ physicalTherapy (อาจถูก override ด้านล่างตาม userStatus)
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
      youhaveCaregiver: data.youhaveCaregiver,
      nationality: data.nationality,
      username: data.username
    };

    // ตรวจสอบ userStatus เพื่ออัปเดต physicalTherapy และบันทึกวันที่ที่จบหรือเริ่มการรักษาใหม่
    if (data.userStatus === TYPESTATUS.TYPE_ST2) {
      // เมื่อสถานะเป็น "จบการรักษา"
      patientPayload.physicalTherapy = false;
      patientPayload.treatmentEndDate = new Date(); // เก็บวันที่จบการรักษา
    } else if (data.userStatus === TYPESTATUS.TYPE_ST1) {
      // เมื่อสถานะเป็น "กำลังรักษา"
      patientPayload.physicalTherapy = true;
      patientPayload.treatmentStartDate = new Date(); // เก็บวันที่เริ่มการรักษาใหม่
    }

    // อัปเดตข้อมูล patient
    const patientResponse = await customFetch.patch(`/allusers/${_id}`, patientPayload);
    console.log("Updated patient response:", patientResponse.data);

    // ส่วนการจัดการข้อมูลผู้ดูแล (caregiver) ยังคงเหมือนเดิม
    if (data.youhaveCaregiver === HAVECAREGIVER.TYPE_CGV1) {
      const caregiverPayload = {
        caregiverID_card_number: data.caregiverID_card_number,
        caregiverName: data.caregiverName,
        caregiverSurname: data.caregiverSurname,
        caregiverTel: data.caregiverTel,
        caregiverRelationship: data.caregiverRelationship,
        user: _id
      };

      console.log("Caregiver payload:", caregiverPayload);

      try {
        if (data.caregiverId) {
          console.log("Updating existing caregiver ID:", data.caregiverId);
          const updateResponse = await customFetch.patch(`/caregiver/${data.caregiverId}`, caregiverPayload);
          console.log("Caregiver update response:", updateResponse.data);
        } else {
          console.log("Creating new caregiver for patient ID:", _id);
          const createResponse = await customFetch.post(`/caregiver`, caregiverPayload);
          console.log("Created new caregiver:", createResponse.data);

          let newCaregiverId = null;
          if (createResponse.data && createResponse.data.caregiver) {
            newCaregiverId = createResponse.data.caregiver._id;
          } else if (createResponse.data.newCaregiver) {
            newCaregiverId = createResponse.data.newCaregiver._id;
          } else if (createResponse.data.existingCaregiver) {
            newCaregiverId = createResponse.data.existingCaregiver._id;
          }

          if (newCaregiverId) {
            console.log("Updating patient with new caregiver ID:", newCaregiverId);
            const caregiverLinkResponse = await customFetch.patch(`/allusers/${_id}`, {
              caregivers: [newCaregiverId]
            });
            console.log("Patient-caregiver link response:", caregiverLinkResponse.data);
          } else {
            console.error("Could not find caregiver ID in response", createResponse.data);
          }
        }
      } catch (error) {
        console.error("Error handling caregiver:", error);
        console.error("Response data:", error.response?.data);
        toast.error(error?.response?.data?.error || error?.response?.data?.msg || "เกิดข้อผิดพลาดในการจัดการข้อมูลผู้ดูแล");
      }
    } else if (data.caregiverId) {
      try {
        console.log("Removing caregiver relationship for patient ID:", _id);
        const deleteResponse = await customFetch.delete(`/caregiver/${data.caregiverId}`, {
          data: { userId: _id }
        });
        console.log("Caregiver relationship deletion response:", deleteResponse.data);

        const unlinkResponse = await customFetch.patch(`/allusers/${_id}`, {
          caregivers: []
        });
        console.log("Patient-caregiver unlink response:", unlinkResponse.data);
      } catch (error) {
        console.error("Error removing caregiver reference:", error);
        console.error("Response data:", error.response?.data);
      }
    }

    toast.success("แก้ไขข้อมูลคนไข้และผู้ดูแลเรียบร้อยแล้ว");
    return redirect("/dashboard/all-patient");
  } catch (error) {
    console.error("Error saving data:", error);
    console.error("Response data:", error.response?.data);
    toast.error(error?.response?.data?.msg || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    return error;
  }
};

const EditPatient = () => {
  const { patient, caregiver } = useLoaderData();
  const navigation = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  if (!patient) {
    return <div className="loading">กำลังโหลดข้อมูลผู้ป่วย...</div>;
  }

  // Format birthday for date input (YYYY-MM-DD)
  const formatBirthday = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting birthday:", error);
      return "";
    }
  };

  // State สำหรับข้อมูลต่างๆ
  const [selectedgender, setSelectedgender] = useState(patient.gender || "");
  const [selectedUserStatus, setSelectedUserStatus] = useState(patient.userStatus || "");
  const [selectedYouhaveCaregiver, setSelectedYouhaveCaregiver] = useState(
    patient.youhaveCaregiver || (caregiver ? HAVECAREGIVER.TYPE_CGV1 : "")
  );

  let initialCaregiverRelationship = "";
  if (caregiver && Array.isArray(caregiver.caregiverRelationship)) {
    const relationshipObj = caregiver.caregiverRelationship.find(
      (rel) => rel.user && rel.user.toString() === patient._id.toString()
    );
    if (relationshipObj) {
      initialCaregiverRelationship = relationshipObj.relationship;
    }
  }

  const [selectedCaregiverRelationship, setSelectedCaregiverRelationship] = useState(
    initialCaregiverRelationship || ""
  );

  const [birthday, setBirthday] = useState(formatBirthday(patient.birthday));
  const [patientData, setPatientData] = useState({
    ...patient,
    physicalTherapy: patient.physicalTherapy,
  });
  const [otherRelation, setOtherRelation] = useState("");

  // Handlers
  const handleYouhaveCaregiverChange = (event) => {
    setSelectedYouhaveCaregiver(event.target.value);
  };

  const handleCaregiverRelationshipChange = (event) => {
    setSelectedCaregiverRelationship(event.target.value);
  };

  const handleOtherRelationChange = (event) => {
    setOtherRelation(event.target.value);
    setSelectedCaregiverRelationship(event.target.value);
  };

  const handleUserTypeChange = (event) => {
    setSelectedgender(event.target.value);
  };

  const handleBirthdayChange = (event) => {
    setBirthday(event.target.value);
  };

  const handleUserStatusChange = (event) => {
    const newStatus = event.target.value;
    setSelectedUserStatus(newStatus);

    // เมื่อสถานะเปลี่ยน ให้ปรับ physicalTherapy ตามค่า userStatus
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
          {/* Hidden inputs */}
          <input type="hidden" name="birthday" value={birthday} />
          <input
            type="hidden"
            name="physicalTherapy"
            value={patientData.physicalTherapy ? "true" : "false"}
          />
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
                    defaultValue={caregiver?.caregiverID_card_number || ""}
                    required={true}
                  />
                  <FormRow
                    type="text"
                    name="caregiverName"
                    labelText="ชื่อ (ผู้ดูแล)"
                    defaultValue={caregiver?.caregiverName || ""}
                    required={true}
                  />
                </div>
                <div className="column2">
                  <FormRow
                    type="tel"
                    name="caregiverTel"
                    labelText="เบอร์โทรศัพท์ (ผู้ดูแล)"
                    defaultValue={caregiver?.caregiverTel || ""}
                    required={true}
                  />
                  <FormRow
                    type="text"
                    name="caregiverSurname"
                    labelText="นามสกุล (ผู้ดูแล)"
                    defaultValue={caregiver?.caregiverSurname || ""}
                    required={true}
                  />
                </div>
                <div className="row">
                  <div className="column3">
                    <FormRowSelectWithCustom
                      name="caregiverRelationship"
                      list={Object.values(RELATIONS).filter((val) => val !== "อื่นๆ")}
                      defaultValue={selectedCaregiverRelationship}
                      onChange={handleCaregiverRelationshipChange}
                      required={true}
                    />
                  </div>
                </div>
                <div>

                </div>
              </div>
            )}
          </div>

          <hr />
          <br />
          <br />
          <div className="physical-therapy-history mt-5 text-center">
            <h4 className="form-title">ประวัติการเปลี่ยนแปลงการรักษา</h4>
            <div className="history-table-container overflow-x-auto mx-auto">
              <table className="w-full table-fixed border-collapse mx-auto">
                {/* กำหนด colgroup ให้แต่ละคอลัมน์กว้าง 1/3 */}
                <colgroup>
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                  <col className="w-1/3" />
                </colgroup>
                <thead className="bg-[#87CEFA]">
                  <tr className="overflow-hidden">
                    <th className="border border-gray-300 p-2 text-center">วันที่</th>
                    <th className="border border-gray-300 p-2 text-center mx-auto">เวลา</th>
                    <th className="border border-gray-300 p-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.physicalTherapyHistory.map((entry, index) => {
                    const dateObj = new Date(entry.changedAt);
                    const datePart = new Intl.DateTimeFormat("th-TH", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(dateObj);
                    const timePart =
                      new Intl.DateTimeFormat("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(dateObj) + " น.";

                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2 text-center">{datePart}</td>
                        <td className="border border-gray-300 p-2 text-center">{timePart}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span className={entry.value ? "text-red-500" : "text-green-500"}>
                            {entry.value ? "กลับมารักษา" : "จบการรักษาไปแล้ว"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="border border-gray-300 p-2 text-center font-bold">
                      <span className="text-red-500 block mb-4">
                        กลับมารักษา :{" "}
                        {patient.physicalTherapyHistory.filter((entry) => entry.value === true).length} ครั้ง
                      </span>
                      <span className="text-green-500 block">
                        จบการรักษา :{" "}
                        {patient.physicalTherapyHistory.filter((entry) => entry.value === false).length} ครั้ง
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-block form-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </Form>
    </Wrapper>
  );
};

export default EditPatient;
