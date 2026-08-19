class BaseProvider {

    async listScanners() {
        throw new Error("Not Implemented");
    }

    async scan(options) {
        throw new Error("Not Implemented");
    }

    async cancel() {
        throw new Error("Not Implemented");
    }

}

module.exports = {BaseProvider};