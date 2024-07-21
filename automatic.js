// +++++++++++ Base By Tabawa ++++++++++
const fs = require('fs');
const path = require('path');
const db = require('./lib/databases.js');
const archiver = require('archiver');

// +++++++++++ automatic reset limit and other automatic ++++++++++
const backup_file_logs = path.join(__dirname, './src/backup.txt');
const cron_file_logs = path.join(__dirname, './src/cronlog.txt');
const TASK_INTERVAL = 1800000; // +++++++++ checking 30 minute interval, reduce server weight
const TASK_INTERVAL2 = 3600000; // +++++++++ checking 1 hour ++++++
const taskStatusFile = './src/statusRealTime.json';

module.exports = (Sekai) => {
async function backup() {
    try {
        const output = fs.createWriteStream('backup.zip');
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', async () => {
            const nomertujuan = '6283834281572@s.whatsapp.net';
            console.log(`${archive.pointer()} total bytes`);
            console.log('Backup has been finalized and the output file descriptor has closed.');

            try {
                const backupFilePath = 'backup.zip';
                if (fs.existsSync(backupFilePath)) {
                    console.log('Backup file exists, proceeding to read file.');
                    const fileBuffer = fs.readFileSync(backupFilePath);
                    await Sekai.sendMessage(
                        nomertujuan,
                        {
                            document: fileBuffer,
                            mimetype: 'application/zip',
                            filename: 'backup.zip'
                        }
                    );
                    const SuksesBackup = 'Success Backup';
                    console.log(SuksesBackup);
                    fs.appendFileSync(backup_file_logs, `${SuksesBackup}\n`);
                    setTimeout(backup, TASK_INTERVAL2);
                } else {
                    console.error('Backup file does not exist.');
                }
            } catch (error) {
                console.error('Error during sendMessage:', error);
                const GagalBackup = `Error ${error}`;
                fs.appendFileSync(backup_file_logs, `${GagalBackup}\n`);
            }
        });

        output.on('error', (err) => {
            console.error('Output stream error:', err);
            throw err;
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            throw err;
        });

        archive.pipe(output);
        archive.directory('databases', false);
        archive.directory('src', false);
        archive.directory('lib', false);
        archive.directory('app', false);
        archive.file('main.js', { name: 'main.js' });

        await archive.finalize();
    } catch (error) {
        console.error('Error during backup process:', error);
    }
}

    // +++++++++ make automated without cron ++++++++++++++
    function readTaskStatus() {
        if (!fs.existsSync(taskStatusFile)) {
            return { task1Executed: false, task2Executed: false, lastExecutionDate: '' };
        }
        const rawData = fs.readFileSync(taskStatusFile);
        return JSON.parse(rawData);
    }

    function writeTaskStatus(status) {
        fs.writeFileSync(taskStatusFile, JSON.stringify(status, null, 2));
    }

    // base by tabawaX Func Reset minimum cpu usage and anti node-cron
    function resetExecutionFlags(status) {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const todayDate = now.toISOString().split('T')[0];
        /* ++++++++ Mengecek Jima Tipe Data /Value berbeda +++++++++++++++
        * Dan Jika Berbeda Akan Func Akan memberikan nilai false dan membuat todaydate baru
        * +++++++++++++++++++++++++++*/
        if (status.lastExecutionDate !== todayDate) {
            status.task1Executed = false;
            status.task2Executed = false;
            status.lastExecutionDate = todayDate;
            writeTaskStatus(status);
            const ResetExecSmsg = `[${todayDate}] Reseting Database to false - Success`;
            fs.appendFileSync(cron_file_logs, `${ResetExecSmsg}\n`);
        }
    }

    async function checkAndExecuteTask() {
        console.log("[ CHECKING ] Checking On Condition Automatic Or Not");
        let status = readTaskStatus(); // still thinking fortunately it relieves the CPU from parsing continuously

        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const hour = now.getHours();
        const minute = now.getMinutes();
        const date = now.getDate();

        resetExecutionFlags(status); // parse ( higher CPU 0.03 - 0.40 )

        // Task 1: antara jam 23:00:00 dan 00:59:59
        if (!status.task1Executed && ((hour === 23 && minute >= 0) || (hour === 0 && minute <= 59))) {
            const groupnya = "120363199432855089@g.us";
            try {
                await Sekai.groupSettingUpdate(groupnya, 'announcement');
                const SuksesGroup = `[${date}-${hour}-${minute}] Group set to 'announcement' - Success`;
                console.log(SuksesGroup);
                fs.appendFileSync(cron_file_logs, `${SuksesGroup}\n`);

                await db.resetAllUsersLimit(10);
                const SuksesCron = `[${date}-${hour}-${minute}] Reset limit to 10 for all users - Success`;
                console.log(SuksesCron);
                fs.appendFileSync(cron_file_logs, `${SuksesCron}\n`);
                status.task1Executed = true;
                writeTaskStatus(status);
            } catch (err) {
                const ErrorMsg = `[${date}-${hour}-${minute}] Error occurred: ${err}`;
                console.error(ErrorMsg);
                fs.appendFileSync(cron_file_logs, `${ErrorMsg}\n`);
            }
        }

        // Task 2: Antara 06:00:00 dan 07:59:59
        if (!status.task2Executed && ((hour === 6 && minute >= 0) || (hour === 7 && minute <= 59))) {
            const groupnya = "120363199432855089@g.us";
            try {
                await Sekai.groupSettingUpdate(groupnya, 'not_announcement');
                const SuksesGroup = `[${date}-${hour}-${minute}] Group set to 'not_announcement' - Success`;
                console.log(SuksesGroup);
                fs.appendFileSync(cron_file_logs, `${SuksesGroup}\n`);
                status.task2Executed = true;
                writeTaskStatus(status);
            } catch (err) {
                const ErrorMsgTask2 = `[${date}-${hour}-${minute}] Error occurred: ${err}`;
                console.error(ErrorMsgTask2);
                fs.appendFileSync(cron_file_logs, `${ErrorMsgTask2}\n`);
            }
        }
        setTimeout(checkAndExecuteTask, TASK_INTERVAL);
    }
    backup()
    checkAndExecuteTask();
}