namespace app {
    /**
     * Stable data for mobile performance
     * @type {Array}
     */
    const CONST_ARR: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255];

    /**
     * Converts the text into an array of the characters numeric Unicode values
     * @param  {String} text, the text to convert
     * @return {Array} the array of Unicode values
     */
    function convert(text: string) {
        const codes: number[] = [];

        for (let i = 0, ii = text.length; i < ii; i++) {
            codes.push(text.charCodeAt(i));
        }

        return codes;
    }

    /**
    * Sets up the key to use with the byte stream
    * @param  {String} key, The key that you want to use
    * @return {Array}, the key stream which with be used in the byteStreamGenerator
    */
    function keySetup(_key: string) {
        const K = [...CONST_ARR];
        let j = 0;
        const key = convert(_key);

        for (let i = 0, ii = K.length; i < ii; i++) {
            j = (j + K[i] + key[i % key.length]) % 256;
            [K[i], K[j]] = [K[j], K[i]];
        }

        return K;
    }

    function byteStreamGenerator(K: number[]) {
        let i = 0;
        let j = 0;
        let temp: number[] = [];
        for (let k = 0, len = K.length; k < len; k++) {
            i = (i + 1) % 256;
            j = (j + K[i]) % 256;
            [K[i], K[j]] = [K[j], K[i]];
            temp.push(K[(K[i] + K[j]) % 256]);
        }
        return temp;
    }


    export class RC4 {
        privateKey: number[];
        encryptKey: string;

        constructor(key: string) {
            if (!key) throw 'Must pass the key to constructor';
            this.privateKey = keySetup(key);
            this.encryptKey = key;
        }

        encrypt(input: string) {
            if (!input) throw 'no input of encrypt';
            let outputText = '';
            const byteStream = byteStreamGenerator([...this.privateKey]);

            for (let i = 0, ii = input.length; i < ii; i++) {
                outputText += String.fromCharCode(input.charCodeAt(i) ^ byteStream[i]);

            }

            return outputText;
        }

        decrypt(input: string) {
            if (!input) throw 'no input of decrypt';
            return this.encrypt(input);
        }

        //因为base64的特殊字符串加密会出问题 所以对应的串刷unicode码的数据给base64加密
        encrypt2(input: string) {
            if (!input) throw 'no input of encrypt';
            const byteStream = byteStreamGenerator([...this.privateKey]);

            let outputs: number[] = [];
            for (let i = 0, ii = input.length; i < ii; i++) {
                outputs.push(input.charCodeAt(i) ^ byteStream[i]);
            }

            return outputs;
        }

        decrypt2(input: string) {
            if (!input) return console.log('no input of decrypt');
            return this.encrypt2(input);
        }
    }
}
