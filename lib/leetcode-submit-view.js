'use babel';

import request from 'request';
// import XRegExp from 'xregexp';
import cheerio from 'cheerio';
import async from 'async';

export default class LeetcodeSubmitView {

    constructor() {
        this.random_question = null;
        this.url = null;
        this.commentSymbol = null;
        this.currentLanguage = null;
        this.editor = null;
        this.levelDict = {
            1: 'Easy',
            2: 'Medium',
            3: 'Hard',
        };
        this.id = null;
        this.allSolutions = null;
        this.fileExt = null;
        this.seperator = Array(60).join('=');
        this.availableLanguages = [];
        this.fileName = null;
        this.testing = false;
        this.loginURL = 'https://leetcode.com/accounts/login/';
        this.submitURL = 'https://leetcode.com/problems/two-sum/submit/';
        this.csrftoken = '';
        this.cookies = '';

    }

    submitSolution(){
      console.log('submitSolution');
      this.editor = atom.workspace.getActiveTextEditor();
      var codes = this.editor.getText();
      codes = codes.replace('\r','');
      console.log(codes);
      // atom.notifications.addInfo(codes);
      var options = {
        url: this.loginURL,
        headers: {
          'Referer':'https://leetcode.com',
          'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1485.0 Safari/537.36',
        },
        jar:true,

      };

      this.download(options).then((result)=>{
        // atom.notifications.addInfo(JSON.stringify(result.response.headers));
        console.log(result.response.headers);
        //step-1: get cookies and csrf_token
        var pattern = /(?=value).+(?=')/g,
        token_re = new RegExp(pattern);
        token_exc = token_re.exec(result.body);
        console.log(token_exc);
        csrf_token = token_exc[0].slice(7);
        console.log(csrf_token);

        var options = {
          method:'POST',
          url: this.loginURL,
          headers: {
            Origin:  'https://leetcode.com',
            Referer: this.loginURL,
            Cookie:  'csrftoken=' + csrf_token + ';'
          },
          form:{
            csrfmiddlewaretoken:csrf_token,
            login:'WuChenJ',
            password:'QAZwsx123'
          },
        };
        console.log(options);
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 302) {
                  resolve({
                     response:response,
                     body:body
                  });
                } else {
                    reject({
                        reason: 'Fail login '
                    });
                }
            });
        });
        // atom.notifications.addInfo(csrf_token.slice(7));
      }).then((loginResult)=>{
        // atom.notifications.addInfo(loginResult);
        atom.workspace.open('test.txt', {
            split: 'right'
        }).then((editor)=>{
          editor.setText(JSON.stringify(loginResult.response.headers));
          var cookies = this.getCookies(loginResult.response);
          // console.log(cookies['messages'].match('Successfully signed in as ([^.]*)')[1]);
          var options = {
            method:'POST',
            url: this.submitURL,
            headers: {
              'Origin':  'https://leetcode.com',
              'Referer': this.loginURL,
              'Cookie':cookies,
              'x-csrftoken':this.csrftoken,
              'X-Requested-With':'XMLHttpRequest',
            },
            form:{
              lang:'cpp',
              json:true,
              test_mode:false,
              typed_code:codes,
              question_id:1,
              judge_type: 'large'
            },
          };
         return this.postData(options);

        });
      }).then((submitResult)=>{
        console.log(submitResult.body);
      }).catch((err) => {
          console.log(err);
      });
    }

    // Function :getCookies
    getCookies(response){
      var  param = response.headers;
      console.log(param['set-cookie']);
      // param[''];
      var cookies = '';
      for (var i=0;i<param['set-cookie'].length;i++)
      {
        tempcookie = param['set-cookie'][i];
        splitcookie = tempcookie.split(';');
        console.log(splitcookie);
        cookies = cookies+ splitcookie[0] + ';' ;

        keyvalue = splitcookie[0].split('=');
        if(keyvalue[0]=='csrftoken'){
          this.csrftoken = keyvalue[1];
          console.log(this.csrftoken);
        }

      }

      console.log(cookies);
      return cookies;
    }

    // getProblem(difficulty, search) {
    //     this.allSolutions = -1;
    //     this.editor = atom.workspace.getActiveTextEditor();
    //     this.testing ? this.currentLanguage = 'Java' : this.currentLanguage = this.editor.getGrammar().name;
    //
    //     if (this.editor && this.currentLanguage === 'Null Grammar') {
    //         atom.notifications.addError(`Please select a language first. (Change 'Plain Text' in bottom right corner)`);
    //     } else {
    //         if (search) {
    //             atom.notifications.addInfo(`Attempting to find "${search}" question...`);
    //         } else if (difficulty) {
    //             atom.notifications.addInfo(`Grabbing ${this.levelDict[difficulty].toLowerCase()} difficulty ${this.currentLanguage} question...`);
    //         }
    //
    //         this.download(this.problemList).then((json) => {
    //                 const questionsJSON = JSON.parse(json).stat_status_pairs.filter((e, i) => {
    //                     if (search) {
    //                         difficulty = e.difficulty.level;
    //                         return e.stat.question__title.toLowerCase() === search.toLowerCase();
    //                     } else if (difficulty) {
    //                         return (e.difficulty.level === difficulty && !e.paid_only);
    //                     }
    //                 });
    //
    //
    //                 if (questionsJSON.length === 0 && search) {
    //                     atom.notifications.addError(`Could not find "${search}" question...`);
    //                     return;
    //                 }
    //
    //                 let questions = [];
    //                 for (var x in questionsJSON) {
    //                     questions.push({
    //                         link: questionsJSON[x].stat.question__title_slug,
    //                         title: questionsJSON[x].stat.question__title
    //                     });
    //                 }
    //
    //                 this.random_question = questions[Math.floor(Math.random() * questions.length)];
    //                 this.url = `https://leetcode.com/problems/${this.random_question.link}`;
    //
    //                 this.fileName = this.random_question.title.toLowerCase().replace(/\s/g, '_');
    //
    //                 return this.download(this.url);
    //             }).then((html) => {
    //                 const question = this.scrape(html);
    //                 const codeText = this.getCode(question);
    //                 const discussId = html.match(/discussCategoryId: "(\d+)"/)[1];
    //                 const discussUrl = `https://discuss.leetcode.com/api/category/${discussId}`;
    //
    //                 if (codeText) {
    //                     this.populateText(question, difficulty, codeText);
    //                     this.download(discussUrl).then((discussData) => {
    //                         atom.notifications.addInfo('Attempting to obtain answers...');
    //
    //                         return this.getSolutionData(discussData);
    //                     }).then((solutions) => {
    //                         if (solutions.length === 0) {
    //                             atom.notifications.addWarning('Could not find any answers!');
    //                         } else {
    //                             this.allSolutions = solutions;
    //                             atom.notifications.addSuccess('Finished obtaining answers!');
    //                         }
    //                     });
    //                 } else {
    //                     atom.notifications.addError(`Please select from the following languages: ${this.availableLanguages}`);
    //                 }
    //             })
    //             .catch((err) => {
    //                 console.log(err);
    //             });
    //     }
    // }


    download(options) {
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {

                    resolve({
                       response:response,
                       body:body
                    });
                } else {
                    reject({
                        reason: 'Unable to download'
                    });
                }
            });
        });
    }

    postData(options) {
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                  resolve({
                     response:response,
                     body:body
                  });
                } else {
                    reject({
                        reason: 'Fail to post data'+response.statusCode+body
                    });
                }
            });
        });
    }
}
