import { useState, useEffect } from "react";
import Wrapper from "../wrappers/PatientsContainer";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { Link } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import customFetch from "../../utils/customFetch";
import { toast } from "react-toastify";
import { useAllPostureContext } from "../../pages/AllPosture";

const PostureContainer = () => {
  const { data } = useAllPostureContext();
  const [loading, setLoading] = useState(false);
  
  // ข้อมูลจะมาจาก context แทนที่จะทำ API call ซ้ำ
  const missions = data?.missions || [];

  const handleDeleteMission = async (missionId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบภารกิจนี้?")) {
      return;
    }

    try {
      setLoading(true);
      await customFetch.delete(`/missions/${missionId}`);
      toast.success("ลบภารกิจสำเร็จ");
      
      // แนะนำให้ reload หน้าแทนที่จะเรียก API เอง
      window.location.reload();
    } catch (error) {
      console.error("Error deleting mission:", error);
      toast.error(error?.response?.data?.msg || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <h2>Loading...</h2>
      </Wrapper>
    );
  }

  if (missions.length === 0) {
    return (
      <Wrapper>
        <br /><br /><br /><h2>ไม่มีข้อมูลภารกิจ</h2>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <table>
        <thead>
          <tr>
            <th>ด่านที่</th>
            <th>ชื่อภารกิจ</th>
            <th>การประเมิน</th>
            <th>จำนวนท่า</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => (
            <tr key={mission._id}>
              <td>{mission.no}</td>
              <td>{mission.name}</td>
              <td>{mission.isEvaluate ? "ประเมิน" : "ไม่ประเมิน"}</td>
              <td>{mission.submission?.length || 0}</td>
              <td className="actions flex gap-3 justify-center">
                <Link to={`/dashboard/add-posture/${mission._id}`} className="btn edit-btn !border-blue-300 !text-blue-300">
                  <IoMdAddCircle />
                </Link>
                <Link to={`/dashboard/edit-posture/${mission._id}`} className="btn edit-btn">
                  <FaEdit />
                </Link>
                <button className="btn delete-btn" onClick={() => handleDeleteMission(mission._id)}>
                  <MdDeleteForever />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Wrapper>
  );
};

export default PostureContainer;
