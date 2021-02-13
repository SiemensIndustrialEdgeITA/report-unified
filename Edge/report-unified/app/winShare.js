const { exec } = require("child_process");


// LOW LEVEL SHELL COMMANDS WRAPPERS
//
function getMounts() {
    // get actual mounted folder with CIFS Protocol
    return new Promise((resolve, reject) => {
        exec("mount -t cifs",
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`[ERR_] - getMounts error: ${error.message}`);
                    return resolve({ "type": "err", "out": error });
                }
                if (stderr) {
                    console.log(`[INFO] - getMounts stderr: ${stderr}`);
                    return resolve({ "type": "stderr", "out": stderr });
                }
                console.log(`[INFO] - getMounts stdout: ${stdout}`);
                return resolve({ "type": "stdout", "out": stdout });
            });
    });
};

function unmountFolder(folder) {
    // unmount a local folder from any type of mounting like CIFS.
    return new Promise((resolve, reject) => {
        exec(`umount ${folder}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`[ERR_] - unmountFolder error: ${error.message}`);
                    return resolve({ "type": "err", "out": error });
                }
                if (stderr) {
                    console.log(`[INFO] - unmountFolder stderr: ${stderr}`);
                    return resolve({ "type": "stderr", "out": stderr });
                }
                console.log(`[INFO] - unmountFolder stdout: ${stdout}`);
                return resolve({ "type": "stdout", "out": stdout });
            });
    });
};

function mountFolder(sharedFolder, user, pass, localFolder) {
    // mount a Windows shared folder based on shared folder URL, the authentication user and password and a local folder
    return new Promise((resolve, reject) => {

        exec(`mount -v -t cifs "${sharedFolder}" -o user=${user},pass=${pass},uid=0,gid=0,sec=ntlmv2 ${localFolder}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`[ERR_] - mountFolder error: ${error.message}`);
                    return resolve({ "type": "err", "out": error });
                }
                if (stderr) {
                    console.log(`[INFO] - mountFolder stderr: ${stderr}`);
                    return resolve({ "type": "stderr", "out": stderr });
                }
                console.log(`[INFO] - mountFolder stdout: ${stdout}`);
                return resolve({ "type": "stdout", "out": stdout });
            });
    });
};


// EXPORTABLE ASYNC FUNCTIONS
//
async function mountShare(sharedFolderUrl, sharedUser, sharedPass, localMountFolder) {
    // mount a windows shared folder to a local path
    console.log(`[INFO] - ${sharedFolderUrl} will be mounted to ${localMountFolder}...`);

    try {
        let actMounts = await getMounts();

        if (actMounts.type == "stdout" && actMounts.out !== undefined) {
            let unmountRes = await unmountFolder(localMountFolder);
        }

        let mountRes = await mountFolder(sharedFolderUrl, sharedUser, sharedPass, localMountFolder);
        if (mountRes.out.startsWith("mount.cifs kernel mount options:")) {
            return true;
        }

        return false
    }
    catch (err) {
        console.log(`[ERR_] - mount failed with error: ${err}`);
    }
}


async function unmountShare(localMountFolder) {
    // unmount a shared folder based on local path
    console.log(`[INFO] - ${localMountFolder} will be unmounted...`);

    try {
        let actMounts = await getMounts();

        if (actMounts.type == "stdout" && actMounts.out !== "") {
            let unmountRes = await unmountFolder(localMountFolder);
            console.log(unmountRes.type, unmountRes.out);
        }

        return
    }
    catch (err) {
        console.log(`[ERR_] - unmount failed with error: ${err}`);
    }
}


// EXPORT MODULES
module.exports.mountShare = mountShare;
module.exports.unmountShare = unmountShare;


//USAGE
// const localMountFolder = "/mnt/winshare";
// const sharedFolderUrl = "//192.168.1.99/iot_share";
// const sharedUser = "iot";
// const sharedPass = "iot";
//let res = mountShare(sharedFolderUrl, sharedUser, sharedPass, localMountFolder);
//console.log(res ? "success" : "error");
//unmountShare(localMountFolder);