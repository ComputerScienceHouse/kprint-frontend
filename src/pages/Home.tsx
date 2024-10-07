import {
  // useOidcAccessToken,
  // useOidc,
  // useOidcIdToken,
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
import {useState, useRef} from "react";
// import {Link} from "react-router-dom";
// import Authenticating from "../callbacks/Authenticating";
// import AuthenticationError from "../callbacks/AuthenticationError";
// import SessionLost from "../callbacks/SessionLost";
// import UserInfo from "../UserInfo";
import {apiPrefix} from "../configuration";
import {PdfControls, PdfPreview} from "../components/PdfPreview";
import {
  UserPageSelectionSet,
  addPageToSet,
  setContainsPage,
  removePageFromSet,
} from "../PageSelectionSet";
import "./Home.tsx.css";

type SuccessReply = {
  message: string;
  job_link: string | null;
  job_id: number | null;
};

const Home = () => {
  // important hooks
  // const { accessTokenPayload } = useOidcAccessToken()   // this contains the user info in raw json format
  // const userInfo = accessTokenPayload as UserInfo       //
  // const { idToken, idTokenPayload } = useOidcIdToken()  // this is how you get the users id token
  // const { login, logout, isAuthenticated } = useOidc()  // this gets the functions to login and logout and the logout state

  const {fetch} = useOidcFetch();
  const [message, setMessage] = useState<SuccessReply | null>(null);

  const pdfControls = useRef<PdfControls>({});

  const onSubmit = useConstCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // const file = formData.get("file");
    formData.delete("file");
    formData.append("title", pdfControls.current?.documentTitle ?? file!!.name);
    console.log(file);

    fetch(
      `${apiPrefix}/printers/${import.meta.env.VITE_PRINTER}/print?${new URLSearchParams(formData as any)}`,
      {
        method: "POST",
        body: file,
      },
    ).then(async (res) => {
      if (res.ok) {
        const json = (await res.json()) as SuccessReply;
        setMessage(json);
      } else {
        console.log("failure", res, await res.text());
      }
    });
  });

  const [colorMode, setColorMode] = useState<"color" | "grayscale">("color");
  const onColorChange = useConstCallback((event) => {
    console.log("Color is uhhh", event.target.value);
    setColorMode(event.target.value);
  });

  const [file, setFile] = useState<File | undefined>();
  const onFileSelected = useConstCallback((event) => {
    console.log("Here's a file!", event);
    setFile(event.target.files[0]);
    console.log("File was set!", event.target.files[0]);
  });

  const [pagesIncluded, setPagesIncluded] = useState<UserPageSelectionSet>({
    text: "",
    validSet: "",
  });

  const onPagesIncludedChanged = useConstCallback((event) => {
    const pagesIncluded = event.target.value;
    let valid = true;
    try {
      setContainsPage(pagesIncluded, 1);
    } catch (err) {
      valid = false;
    }
    console.log("Set pages included gooo", pagesIncluded);
    setPagesIncluded((old) => ({
      text: pagesIncluded,
      validSet: valid ? pagesIncluded : old.validSet,
    }));
  });

  const setPageIncluded = useConstCallback(
    (page: number, included: boolean, pdfPageCount: number) => {
      setPagesIncluded((set) => {
        const newSetText = included
          ? addPageToSet(set.text, page)
          : removePageFromSet(set.text, page, pdfPageCount);
        return {text: newSetText, validSet: newSetText};
      });
    },
  );

  return (
    <div className="pane-splitter">
      <div className="pdf-pane">
        {file && (
          <PdfPreview
            pdfBlob={file}
            pdfControls={pdfControls.current}
            colorMode={colorMode}
            pagesIncluded={pagesIncluded}
            setPageIncluded={setPageIncluded}
          />
        )}
      </div>
      <div className="form-pane">
        {message && <Alert>{message.message} <a href={message.job_link!!}>View Job {message.job_id!!}</a></Alert>}
        <Form onSubmit={onSubmit}>
          <FormGroup>
            <Label for="file">File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              onChange={onFileSelected}
              required
            />
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
              type="text"
              value={pagesIncluded.text}
              invalid={pagesIncluded.text != pagesIncluded.validSet}
              onChange={onPagesIncludedChanged}
              placeholder="e.g. 1-5, 8, 11-13"
            />
          </FormGroup>

          <Button type="submit">Print</Button>
        </Form>
      </div>
    </div>
  );
};

export default Home;
