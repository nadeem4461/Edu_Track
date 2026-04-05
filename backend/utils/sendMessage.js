export const sendAbsentAlert =async(parentPhone, studentName , date)=>{
    try {
        const message = `Alert from Sir: ${studentName} is marked ABSENT for tuition on ${date}.`;
        console.log(`\n🟢 [WHATSAPP API TRIGGERED]`);
    console.log(`To: +91${parentPhone}`);
    console.log(`Message: ${message}\n`);
    return true;
    } catch (error) {
        console.error('Error sending absent alert:', error);
        return false;
    }
}