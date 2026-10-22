import {
  // useOidcAccessToken,
  // useOidc,
  // useOidcIdToken,
  useOidcFetch,
} from "@axa-fr/react-oidc";
import { useConstCallback } from "powerhooks";
import { useRef, useState, useEffect } from "react";
import { Alert, Badge, Button, Form, FormGroup, Input, Label } from "reactstrap";
// import {Link} from "react-router-dom";
// import Authenticating from "../callbacks/Authenticating";
// import AuthenticationError from "../callbacks/AuthenticationError";
// import SessionLost from "../callbacks/SessionLost";
// import UserInfo from "../UserInfo";
import { PdfControls, PdfPreview } from "../components/PdfPreview";
import { apiPrefix } from "../configuration";
import {
  UserPageSelectionSet,
  addPageToSet,
  removePageFromSet,
  setContainsPage,
} from "../PageSelectionSet";
import "./Home.tsx.css";

type SuccessReply = {
  message: string;
  job_link: string | null;
  job_id: number | null;
};

type PrinterStatus = {
  has_error: boolean;
  printer: string;
  reasons: string[];
};

const Home = () => {
  // important hooks
  // const { accessTokenPayload } = useOidcAccessToken()   // this contains the user info in raw json format
  // const userInfo = accessTokenPayload as UserInfo       //
  // const { idToken, idTokenPayload } = useOidcIdToken()  // this is how you get the users id token
  // const { login, logout, isAuthenticated } = useOidc()  // this gets the functions to login and logout and the logout state

  const { fetch } = useOidcFetch();
  const [message, setMessage] = useState<SuccessReply | null>(null);

  const [printers, setPrinters] = useState<string[]>([]);
  const [printer, setPrinter] = useState("");
  const [copies, setCopies] = useState(1);

  const [statuses, setStatuses] = useState<PrinterStatus[]>([]);
  const status = statuses.find(
    (s) => s.printer.split(".")[0].toLowerCase() === printer.toLowerCase(),
  );

  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiPrefix}/printers`)
      .then((res) => {
        return res.json();
      })
      .then((names: string[]) => {
        setPrinters(names);
        setPrinter(names[0] ?? "");
      });
  }, [fetch]);

  useEffect(() => {
    fetch(`${apiPrefix}/printers/status`)
      .then((res) => res.json())
      .then(setStatuses)
      .catch(() => {});
  }, [fetch]);

  const [pdfWidth, setPdfWidth] = useState(60);
  const splitterRef = useRef<HTMLDivElement | null>(null);

  const pdfControls = useRef<PdfControls>({});

  const onSubmit = useConstCallback((event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // const file = formData.get("file");
    formData.delete("file");
    formData.append("title", pdfControls.current?.documentTitle ?? file!!.name);
    console.log(file);
    fetch(
            `${apiPrefix}/printers/${encodeURIComponent(printer)}/print?${new URLSearchParams(formData as any)}`,
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
        setPrintError("Printer has an error!");
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
        return { text: newSetText, validSet: newSetText };
      });
    },
  );

  //IDK I was bored. Allows user to resize pdfviewer and form pane

  const startResizing = (event: React.MouseEvent) => {
    event.preventDefault();

    const handleMouseMove = (event: MouseEvent) => {
      if (!splitterRef.current) return;

      const rect = splitterRef.current.getBoundingClientRect();

      const newWidth = ((event.clientX - rect.left) / rect.width) * 100;

      const clampedWidth = Math.min(Math.max(newWidth, 30), 80);

      setPdfWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="pane-splitter" ref={splitterRef}>
      <div className="pdf-pane" style={{ width: `${pdfWidth}%` }}>
        {file ? (
          <PdfPreview
            pdfBlob={file}
            pdfControls={pdfControls.current}
            colorMode={colorMode}
            pagesIncluded={pagesIncluded}
            setPageIncluded={setPageIncluded}
          />
        ) : (
          <div className="pdf-empty">
            <span className="material-icons pdf-empty-icon">description</span>

            <h5>No file selected</h5>
            <p>Select a file to see a preview before printing.</p>
          </div>
        )}
      </div>

      <div className="pane-resizer" onMouseDown={startResizing} />

      <div className="form-pane" style={{ width: `${100 - pdfWidth}%` }}>
        {message && (
          <Alert>
            {message.message}{" "}
            <a href={message.job_link!!}>View Job {message.job_id!!}</a>
          </Alert>
        )}
        {printError && <Alert color="danger">{printError}</Alert>}
        <Form onSubmit={onSubmit}>
          <FormGroup className="input-container">
            <Label for="printer" className="input-label">
              Printer
            </Label>
            <Input
              id="printer"
              name="printer"
              type="select"
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              disabled={printers.length === 0}
              required
              className="input-select-style-fix"
            >
              {printers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Input>
          </FormGroup>
          {status && (
            <FormGroup className="input-container">
              <Label className="input-label">Printer Health</Label>
              <div>
                <Badge color={status.has_error ? "danger" : "success"}>
                  {status.has_error ? "Not ready" : "Healthy"}
                </Badge>{" "}
                {status.has_error &&
                  status.reasons.map((r) => (
                    <Badge key={r} color="warning" className="me-1">
                      {r}
                    </Badge>
                  ))}
              </div>
            </FormGroup>
          )}
          <FormGroup className="input-container">
            <Label for="file" className="input-label">
              File
            </Label>

            <div className="file-selector-container">
              <div className="custom-file-input">
                <Label for="file" className="file-button">
                  Select File
                </Label>

                <span className="file-name">
                  {file ? file.name : "Select a file to print"}
                </span>

                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={onFileSelected}
                  className="file-input-hidden"
                  aria-describedby="file-help"
                  required
                />
              </div>

              <small id="file-help" className="file-help">
                Maximum file size: 25 MB
              </small>
            </div>
          </FormGroup>

          <FormGroup className="input-container">
            <Label for="sides" className="input-label">
              Sides
            </Label>
            <Input
              id="sides"
              name="sides"
              type="select"
              className="input-select-style-fix"
            >
              <option value="one-sided">Single Sided</option>
              <option value="two-sided-long-edge">
                Long Edge Double Sided
              </option>
              <option value="two-sided-short-edge">
                Short Edge Double Sided
              </option>
            </Input>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="colorMode" className="input-label">
              Color Mode
            </Label>
            <Input
              id="colorMode"
              name="colorMode"
              type="select"
              value={colorMode}
              onChange={onColorChange}
              className="input-select-style-fix"
            >
              <option value="color">Color</option>
              <option value="grayscale">Black + White</option>
            </Input>
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="copies" className="input-label">
              Copies
            </Label>

            <Input
              id="copies"
              name="copies"
              type="number"
              value={copies}
              min={1}
              onChange={(e) => setCopies(Number(e.target.value))}
            />
          </FormGroup>
          <FormGroup className="input-container">
            <Label for="pages" className="input-label">
              Page Range
            </Label>
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

          <Button type="submit" color="primary" className="w-100">
            Print
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Home;
