import {Container} from "reactstrap";
import NavBar from "../components/NavBar";

type Props = {
  children: React.ReactNode;
};

export default function PageContainer({children}: Props) {
  return (
    <div style={{marginTop: "90px"}}>
      <Container className="main" fluid>
        <NavBar />
        <Container>{children}</Container>
      </Container>
    </div>
  );
}
