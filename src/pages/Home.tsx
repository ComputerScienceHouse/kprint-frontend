import {
  useOidcAccessToken,
  useOidc,
  useOidcIdToken,
  useOidcFetch,
} from "@axa-fr/react-oidc";
import {useConstCallback} from "powerhooks";
import {
  Alert,
  Form,
  FormGroup,
  Input,
  Button,
  FormText,
  Label,
} from "reactstrap";
import {useState} from "react";
import {Link} from "react-router-dom";
import Authenticating from "../callbacks/Authenticating";
import AuthenticationError from "../callbacks/AuthenticationError";
import SessionLost from "../callbacks/SessionLost";
import UserInfo from "../UserInfo";
import {apiPrefix} from "../configuration";
import {PdfPreview} from "../components/PdfPreview";

type SuccessReply = {
  message: string;
};

const Home = () => {
  // important hooks
  // const { accessTokenPayload } = useOidcAccessToken()   // this contains the user info in raw json format
  // const userInfo = accessTokenPayload as UserInfo       //
  // const { idToken, idTokenPayload } = useOidcIdToken()  // this is how you get the users id token
  // const { login, logout, isAuthenticated } = useOidc()  // this gets the functions to login and logout and the logout state

  const {fetch} = useOidcFetch();
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = useConstCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const file = formData.get("file");
    formData.delete("file");
    console.log(file);

    fetch(
      `${apiPrefix}/printers/Cinnabar2/print?${new URLSearchParams(formData)}`,
      {
        method: "POST",
        body: file,
      },
    ).then(async (res) => {
      if (res.ok) {
        const json = (await res.json()) as SuccessReply;
        setMessage(json.message);
      } else {
        console.log("failure", res, await res.text());
      }
    });
  });

  const [file, setFile] = useState<File | undefined>();
  const onFileSelected = useConstCallback((event) => {
    console.log("Here's a file!", event);
    setFile(event.target.files[0]);
  });

  const [colorMode, setColorMode] = useState("color");
  const onColorChange = useConstCallback((event) => {
    console.log("Color is uhhh", event.target.value);
    setColorMode(event.target.value);
  });

  return (
    <div>
      {message && <Alert>{message}</Alert>}
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label for="file">File</Label>
          <Input id="file" name="file" type="file" onChange={onFileSelected} />
          <FormText>Document you'd like to print</FormText>
        </FormGroup>
        <FormGroup>
          <Label for="sides">Double-Sided</Label>
          <Input id="sides" name="sides" type="select">
            <option value="one-sided">Single Sided</option>
            <option value="two-sided-long-edge">
              Double Sided (Long Edge)
            </option>
            <option value="two-sided-short-edge">
              Double Sided (Short Edge)
            </option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="colorMode">Color Mode</Label>
          <Input
            id="colorMode"
            name="colorMode"
            type="select"
            value={colorMode}
            onChange={onColorChange}
          >
            <option value="color">Color</option>
            <option value="grayscale">Grayscale</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="copies">Copies</Label>
          <Input
            id="copies"
            name="copies"
            type="number"
            defaultValue={1}
            min={1}
          />
        </FormGroup>
        <FormGroup>
          <Label for="pages">Page Range</Label>
          <Input
            id="pages"
            name="pages"
            type="string"
            defaultValue=""
            placeholder="e.g. 1-5, 8, 11-13"
          />
        </FormGroup>

        {file && <PdfPreview pdfBlob={file} colorMode={colorMode} />}
        <Button type="submit">Print</Button>
      </Form>
    </div>
  );
};

export default Home;
