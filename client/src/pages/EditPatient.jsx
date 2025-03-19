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

// Loader ดึงข้อมูล patient และถ้ามีข้อมูลผู้ดูแล (caregiver) ให้ดึงมาแสดงด้วย
export const loader = async ({ params }) => {
  console.log("📌 Loading patient with ID:", params._id);
  try {
    const { _id } = params;
    if (!_id) throw new Error("Invalid ID");

    // ดึงข้อมูล patient จาก API และแสดงรายละเอียดของ response
    console.log("Fetching patient data from:", `/allusers/${_id}`);
    const patientResponse = await customFetch.get(`/allusers/${_id}`);
    console.log("Patient API response:", patientResponse.data);
    
    if (!patientResponse.data || !patientResponse.data.patient) {
      console.error("API returned unexpected data structure:", patientResponse.data);
      throw new Error("Invalid API response format");
    }
    
    const patientData = patientResponse.data.patient;
    console.log("Patient data loaded:", patientData);
    
    // เตรียมข้อมูลผลลัพธ์
    const result = { patient: patientData, caregiver: null };

    // ถ้าผู้ป่วยมีหมายเลขบัตรประชาชน ให้ดึงข้อมูลผู้ดูแล (ถ้ามี)
    console.log("Checking for caregiver data...");
    try {
      // ดึงข้อมูลผู้ดูแลโดยใช้ ID ของคนไข้
      const caregiverEndpoint = `/caregiver/patient/${_id}`;
      console.log("Fetching caregiver data from:", caregiverEndpoint);
      const caregiverResponse = await customFetch.get(caregiverEndpoint);
      console.log("Caregiver API raw response:", caregiverResponse);
      console.log("Caregiver API response data:", caregiverResponse.data);
      
      if (caregiverResponse.data && caregiverResponse.data.status === "Ok" && caregiverResponse.data.caregiver) {
        result.caregiver = caregiverResponse.data.caregiver;
        console.log("Caregiver data loaded:", result.caregiver);
        console.log("Caregiver ID:", result.caregiver._id);
        console.log("Caregiver name:", result.caregiver.caregiverName);
        console.log("Caregiver relationship data:", result.caregiver.caregiverRelationship);
        
        // ถ้ามีข้อมูลผู้ดูแล ให้ตั้งค่า youhaveCaregiver เป็น TYPE_CGV1 (มีผู้ดูแล)
        result.patient.youhaveCaregiver = HAVECAREGIVER.TYPE_CGV1;
      } else {
        console.log("No caregiver data in response or invalid format");
      }
    } catch (error) {
      console.error("Error fetching caregiver data:", error);
      console.log("Error response:", error.response?.data);
      // ถ้าไม่มีข้อมูลผู้ดูแล ไม่ต้องทำอะไร
    }

    console.log("Final loader result:", result);
    return result;
  } catch (error) {
    console.error("Error loading patient data:", error);
    toast.error(error?.response?.data?.msg || "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
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
    const patientResponse = await customFetch.patch(`/allusers/${_id}`, patientPayload);
    console.log("Updated patient response:", patientResponse.data);

    // ถ้าเลือกว่ามีผู้ดูแล (TYPE_CGV1) ให้สร้างหรืออัปเดตข้อมูลผู้ดูแล
    if (data.youhaveCaregiver === HAVECAREGIVER.TYPE_CGV1) {
      // สร้าง payload สำหรับผู้ดูแล
      const caregiverPayload = {
        // ใช้ชื่อฟิลด์ตามที่เป็นในโมเดล Caregiver
        caregiverID_card_number: data.caregiverID_card_number,
        caregiverName: data.caregiverName,
        caregiverSurname: data.caregiverSurname,
        caregiverTel: data.caregiverTel,
        caregiverRelationship: data.caregiverRelationship,
        // ส่งค่า user ID เพื่อเชื่อมโยงกับผู้ป่วย
        user: _id 
      };

      console.log("Caregiver payload:", caregiverPayload);

      try {
        if (data.caregiverId) {
          // ถ้ามี caregiverId แสดงว่าผู้ดูแลมีอยู่แล้ว ให้อัปเดต
          console.log("Updating existing caregiver ID:", data.caregiverId);
          const updateResponse = await customFetch.patch(`/caregiver/${data.caregiverId}`, caregiverPayload);
          console.log("Caregiver update response:", updateResponse.data);
        } else {
          // ถ้าไม่มี caregiverId แสดงว่าต้องสร้างผู้ดูแลใหม่
          console.log("Creating new caregiver for patient ID:", _id);
          const createResponse = await customFetch.post(`/caregiver`, caregiverPayload);
          console.log("Created new caregiver:", createResponse.data);
          
          // อัปเดต patient ด้วย caregiver ID ที่สร้างใหม่
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
      // ถ้าเปลี่ยนจากมีผู้ดูแลเป็นไม่มี ให้ลบการอ้างอิงผู้ดูแล
      try {
        console.log("Removing caregiver relationship for patient ID:", _id);
        const deleteResponse = await customFetch.delete(`/caregiver/${data.caregiverId}`, {
          data: { userId: _id }
        });
        console.log("Caregiver relationship deletion response:", deleteResponse.data);
        
        // ลบการอ้างอิงผู้ดูแลจาก patient
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
  console.log("EditPatient component rendering with:", { patient, caregiver });
  
  // ตรวจสอบว่าข้อมูลผู้ป่วยมีอยู่จริง
  if (!patient) {
    return <div className="loading">กำลังโหลดข้อมูลผู้ป่วย...</div>;
  }

  // Debug display for caregiver
  console.log("CAREGIVER DATA FROM LOADER:", caregiver);
  if (caregiver) {
    console.log("Caregiver ID:", caregiver._id);
    console.log("Caregiver ID_card_number:", caregiver.caregiverID_card_number);
    console.log("Caregiver name:", caregiver.caregiverName);
    console.log("Caregiver surname:", caregiver.caregiverSurname);
    console.log("Caregiver tel:", caregiver.caregiverTel);
    console.log("Caregiver relationship:", caregiver.caregiverRelationship);
  } else {
    console.log("NO CAREGIVER DATA AVAILABLE");
  }

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

  // Debug info about caregiver relationship data
  if (caregiver) {
    console.log("Caregiver relationship data:", caregiver.caregiverRelationship);
    
    // Check if it's an array and has data
    if (Array.isArray(caregiver.caregiverRelationship) && caregiver.caregiverRelationship.length > 0) {
      console.log("First relationship item:", caregiver.caregiverRelationship[0]);
      console.log("Patient ID for comparison:", patient._id);
      
      // Find the relationship that matches this patient
      const relationship = caregiver.caregiverRelationship.find(
        rel => rel.user && rel.user.toString() === patient._id.toString()
      );
      
      if (relationship) {
        console.log("Found matching relationship:", relationship);
      } else {
        console.log("No matching relationship found for this patient");
      }
    }
  }

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
  
  // Find the caregiver relationship for this patient
  let initialCaregiverRelationship = "";
  if (caregiver && Array.isArray(caregiver.caregiverRelationship)) {
    const relationshipObj = caregiver.caregiverRelationship.find(
      rel => rel.user && rel.user.toString() === patient._id.toString()
    );
    if (relationshipObj) {
      initialCaregiverRelationship = relationshipObj.relationship;
    }
  }
  
  const [selectedCaregiverRelationship, setSelectedCaregiverRelationship] = useState(
    initialCaregiverRelationship || ""
  );
  
  // Initialize birthday with formatted date
  const [birthday, setBirthday] = useState(formatBirthday(patient.birthday));

  const [patientData, setPatientData] = useState({
    ...patient,
    physicalTherapy: patient.physicalTherapy,
  });

  // Add state for custom relationship
  const [otherRelation, setOtherRelation] = useState("");
  
  // Handler สำหรับข้อมูลผู้ดูแล
  const handleYouhaveCaregiverChange = (event) => {
    setSelectedYouhaveCaregiver(event.target.value);
  };

  // Update relationship change handler
  const handleCaregiverRelationshipChange = (event) => {
    console.log("Relationship changed:", event.target.value);
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
                  {/* Debug information */}
                  {caregiver && (
                    <div className="debug-info" style={{margin: '10px 0', padding: '10px', border: '1px solid #eee', borderRadius: '4px', fontSize: '12px', display: 'none'}}>
                      <p>Caregiver Debug Info:</p>
                      <pre>{JSON.stringify(caregiver, null, 2)}</pre>
                    </div>
                  )}
                  
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
                  <FormRow
                    type="text"
                    name="caregiverSurname"
                    labelText="นามสกุล (ผู้ดูแล)"
                    defaultValue={caregiver?.caregiverSurname || ""}
                    required={true}
                  />
                  <FormRow
                    type="tel"
                    name="caregiverTel"
                    labelText="เบอร์โทรศัพท์ (ผู้ดูแล)"
                    defaultValue={caregiver?.caregiverTel || ""}
                    required={true}
                  />
                  <FormRowSelectWithCustom
                    name="caregiverRelationship"
                    labelText="ความสัมพันธ์กับผู้ป่วย"
                    list={Object.values(RELATIONS).filter(val => val !== "อื่นๆ")}
                    defaultValue={selectedCaregiverRelationship}
                    onChange={handleCaregiverRelationshipChange}
                    required={true}
                  />
                </div>
              </div>
            )}
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