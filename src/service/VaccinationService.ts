import axios, { AxiosRequestConfig } from 'axios';
import moment from 'moment';
import sha256 from 'crypto-js/sha256';
import jwt_decode from "jwt-decode";

export class VaccinationService {
    baseUrl = 'https://cdn-api.co-vin.in/api/v2'
    async getAvailableCenters(minimumRq: number) {
        try {
            const today = moment().format('DD-MM-YYYY');
            // Pune 363, Bhopal 312
            const options: AxiosRequestConfig = {
                params: { district_id: '363', date: today },
            };
            const response = await axios.get(`${this.baseUrl}/appointment/sessions/calendarByDistrict`, options);
            if (response.status === 200) {
                document.body.style.backgroundColor = "white";

                const centers = response.data.centers;
                let matchingCenters: any[] = [];
                if (centers && centers.length > 0) {
                    centers.forEach((center: any) => {
                        const sessions = center.sessions;
                        if (sessions && sessions.length > 0) {
                            const matchingSession = sessions.find((x: any) => x.min_age_limit && x.min_age_limit === 18 && x.available_capacity >= minimumRq);

                            if (matchingSession) {
                                document.body.style.backgroundColor = "red";
                                (document as any).getElementById("myAudio").loop = true;
                                (document as any).getElementById("myAudio").play();

                                matchingCenters.push({
                                    center_id: center.center_id,
                                    name: center.name,
                                    address: `${center.address} ${center.pincode}`,
                                    session_id: matchingSession.session_id,
                                    vaccine: matchingSession.vaccine,
                                    age_limit: matchingSession.min_age_limit,
                                    slots: matchingSession.slots,
                                    capacity: matchingSession.available_capacity,
                                })
                            }

                        }
                    });
                }
                return {
                    data: matchingCenters,
                    error: null,
                }
            }

            return {
                data: null,
                error: 'Failed to get the available centers.'
            }
        } catch (ex) {
            return {
                data: null,
                error: `Failed to get the available centers. ${ex}`
            }
        }
    }


    async generateOtp(number: Number) {
        document.body.style.backgroundColor = "green";

        try {
            let options = {
                headers: {
                    'content-type': 'application/json',
                }
            };

            let data: any = {
                secret: 'U2FsdGVkX199TBOc2moLDE5/PlWpWaOwcwYrTyDfF/bDr5TRNechZ1JWDbOJ+WvLzHp/2E/WNIFqLkvFdLExEA==',
                mobile: Number(number)
            };
            const response = await axios.post(`${this.baseUrl}/auth/generateMobileOTP`, data, options);
            if (response && response.status === 200) {
                return {
                    data: { transactionId: response.data.txnId },
                    error: null,
                };
            }

            return {
                data: null,
                error: `Error occured while trying to generate the otp.`
            }
        } catch (e) {
            return {
                data: null,
                error: `Error. ${e}`
            }
        }
    }

    async validateOtp(number: string, transactionId: string) {
        try {
            const encryptedNumber = sha256(number);
            let options = {
                headers: {
                    'content-type': 'application/json',
                },

            };

            let data = {
                otp: encryptedNumber.toString(),
                txnId: transactionId
            }
            const response = await axios.post(`${this.baseUrl}/auth/validateMobileOtp`, data, options);
            if (response && response.status === 200) {
                return {
                    data: {
                        token: response.data.token,
                        //decoded: jwt_decode(response.data.token),
                    },
                    error: ''
                }
            }
        } catch (e) {
            return {
                data: null,
                error: `Error: ${e}`,
            }
        }
    }

    async getParticipants(token: string) {
        try {
            const options: AxiosRequestConfig = {
                headers: { 'authorization': `Bearer ${token}` },
            };
            const response = await axios.get(`${this.baseUrl}/appointment/beneficiaries`, options);
            if (response && response.status === 200) {
                let beneficiaries = response.data.beneficiaries || [];
                return {
                    data: beneficiaries.map((x: any) => {
                        return {
                            name: x.name,
                            id: x.beneficiary_reference_id,
                            gender: x.gender,
                            photoId: x.photo_id_number
                        }
                    })
                }
            }

            return {
                error: 'Failed to get list of beneficiaries.'
            }
        }
        catch (e) {
            return {
                data: null,
                error: 'failed to get benficiaries'
            }
        }
    }

    async getCaptcha(token: string) {
        try {
            const options: AxiosRequestConfig = {
                headers: { 'authorization': `Bearer ${token}` },
            };
            const response = await axios.post(`${this.baseUrl}/auth/getRecaptcha`, {}, options);
            if (response && response.status === 200) {
                return {
                    data: response.data.captcha
                }
            }

            return {
                error: 'Failed to get captcha'
            }
        }
        catch (e) {
            return {
                data: null,
                error: 'Faile to get capthca'
            }
        }
    }


    async scheduleSlot(token: string, captcha: string, centerId: number, sessionId: string, slot: string, beneficiaries: string[]) {
        try {

            let options = {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${token}`
                },

            };

            (document as any).getElementById("myAudio").pause();


            let data = {
                center_id: centerId,
                session_id: sessionId,
                beneficiaries: beneficiaries,
                slot: slot,
                captcha: captcha,
                dose: 1,
            }
            const response = await axios.post(`${this.baseUrl}/appointment/schedule`, data, options);
            if (response && response.status === 200) {
                return {
                    data: response.data,
                    error: ''
                }
            }

            return {
                data: null,
                error: 'Faile to schedule slot'
            }
        } catch (e) {
            return {
                data: null,
                error: `Error: ${e}`,
            }
        }
    }
}
