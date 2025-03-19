import { useContext, createContext, useEffect } from "react";
import { toast } from "react-toastify";
import customFetch from "../utils/customFetch.js";
import MissionContainer from "../assets/components/PostureContainer.jsx";
import AddButton from "../assets/components/AddButton.jsx";
import AllHeader from "../assets/components/AllHeader.jsx";
import { useLoaderData, useNavigate } from "react-router-dom";
import { MdOutlineAutoDelete } from "react-icons/md";
import SoftDelete from "../assets/components/SoftDelete.jsx";
import SearchMissionContainer from '../assets/components/SearchMissionContainer.jsx';

export const loader = async ({ request }) => {
  console.log("🔍 Loading URL:", request.url);
  
  const params = Object.fromEntries([...new URL(request.url).searchParams.entries()]);
  console.log("🔍 Search params:", params);
  
  try {
    const { data } = await customFetch.get("/missions", { params });
    console.log("🔍 Missions data received:", data);
    
    return {
      data,
      searchValues: { ...params },
    };
  } catch (error) {
    console.error("❌ Error loading missions:", error);
    toast.error(error?.response?.data?.msg || "Failed to load missions");
    return {
      data: { missions: [] },
      searchValues: { ...params },
      error: error?.response?.data?.msg || "Failed to load missions"
    };
  }
};

const AllPostureContext = createContext();

const AllPosture = () => {
  const { data, searchValues, error } = useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 Loaded data:", data);
    console.log("🔍 Search values:", searchValues);
    
    if (error) {
      console.error("❌ Error:", error);
      toast.error(error);
    }
    
    if (data && data.missions) {
      console.log(`🔍 Missions loaded: ${data.missions.length} items`);
    } else {
      console.log("🔍 No missions data available");
    }
  }, [data, searchValues, error]);

  return (
    <AllPostureContext.Provider value={{ data, searchValues }}>
      <SearchMissionContainer />
      <SoftDelete onClick={() => navigate("/dashboard/history-deleted-posture")}>
        <MdOutlineAutoDelete />
      </SoftDelete>
      <AddButton className="mx-3" onClick={() => navigate("/dashboard/add-posture")}>
        <b>+</b> เพิ่มด่านกายภาพ
      </AddButton>
      <AllHeader>ภารกิจทั้งหมด</AllHeader>
      <MissionContainer />
    </AllPostureContext.Provider>
  );
};

export const useAllPostureContext = () => useContext(AllPostureContext);
export default AllPosture;
