import Wrapper from "../wrappers/PatientInfo";

const PostureInfo = ({ icon, text }) => {
  return (
    <Wrapper>
      <span className="posture-icon">{icon}</span>
      <span className="posture-text">{text}</span>
    </Wrapper>
  );
};
export default PostureInfo;
