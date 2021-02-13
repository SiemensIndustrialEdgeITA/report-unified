export async function ReportToPDF(filename) {

    // where OOffice is located
    let programName = "/opt/siemens/App_Restriction/runLibreoffice.sh";

    let usbPort = filename.split("/")[0];
    // command to convert File to PDF
    let programParameters = "--headless --nologo --nofirststartwizard --norestore --convert-to pdf:calc_pdf_Export  --outdir /media/simatic/";
    // the file path of the report to be converted
    let filePath = "/media/simatic/" + filename;

    let conversionParameters = programParameters + usbPort + "/ " + filePath;
    //HMIRuntime.Trace("conversion" + conversionParameters);
    //let conversionParameters = "--headless --nologo --nofirststartwizard --norestore --convert-to pdf:calc_pdf_Export --outdir /media/simatic/X61/ /media/simatic/X61/Unified_Report_2021-02-02_10-58-08_Template_Production.xlsx"

    try {
        // start conversion
        await HMIRuntime.Device.SysFct.StartProgram(programName, conversionParameters, 0, true, undefined);

        HMIRuntime.Trace("File " + filename + "converted to PDF.");
        // send ready response to app
        Tags("rpc_response").Write("2");
    }
    catch (err) {
        HMIRuntime.Trace("err " + err);
    }

}