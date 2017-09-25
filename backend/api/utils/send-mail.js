const mandrill = require('mandrill-api/mandrill');
const config = require('../../config/config');

const mandrillClient = new mandrill.Mandrill(config.mandrill.apiKey);

/**
 * @param {string} params.from
 * @param {Object[]} params.to
 * @param {string} params.to[].email
 * @param {string} params.to[].name
 * @param {string} params.template
 * @param {string} params.body
 * @param {Object} params.emailVars
 * @returns {Promise}
 */
function sendEmail(params) {
    const emailVars = Object.keys(params.emailVars).map(key => ({
        name: key,
        content: params.emailVars[key]
    }));

    const mandrillParams = {
        template_name: params.template,
        template_content: [],
        message: {
            to: params.to,
            from_email: params.from || config.mandrill.from,
            global_merge_vars: emailVars
        }
    };

    return new Promise((resolve, reject) => {
        mandrillClient.messages.sendTemplate(
            mandrillParams,
            result => resolve(result),
            e => reject(e)
        );
    });
}

module.exports = sendEmail;
