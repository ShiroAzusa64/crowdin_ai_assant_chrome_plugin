function $$(selector){
    return document.querySelectorAll(selector);
}

var pendingTread=0;
var cacheThread=0;
var strHistory=[];


function getKeywordAll(){
    let html=$$("#source_context_container [data-testid]");
    let content=[];
    content.push($$(".singular")[0].textContent);
    content=content.concat(html[1].textContent.split('\n'));
    return content;
}
function getKeyword(){
  return $$(".singular")[0].textContent;
}

async function setupButton(func,func2){
    while($$('button#suggest_translation').length==0){
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    var oldButton=$$('button#suggest_translation')[0];
    var newButton=oldButton.cloneNode(true);
    newButton.textContent = ' ';
    newButton.id='ai_btn';
    newButton.replaceWith(newButton.cloneNode(true));
    newButton.addEventListener('click',func);
    oldButton.parentNode.appendChild(newButton);
    $$('button#ai_btn')[0].textContent=`${pendingTread} pending,${cacheThread} cache`;
    oldButton=$$('button#action_copy_source')[0];
    newButton=oldButton.cloneNode(true);
    newButton.id='copyAndCommit';
    newButton.class='btn '
    newButton.replaceWith(newButton.cloneNode(true));
    newButton.addEventListener('click',func2);
    oldButton.parentNode.appendChild(newButton);
    oldButton=$$('button#action_select_text')[0];
    newButton=oldButton.cloneNode(true);
    newButton.id='quotReplace';
    newButton.class='btn '
    newButton.replaceWith(newButton.cloneNode(true));
    newButton.addEventListener('click',()=>{
      setText($$("textarea#translation")[0].value.replaceAll("（"," (").replaceAll("）",") "));
    });
    oldButton.parentNode.appendChild(newButton);
    $$('button#suggest_translation')[0].addEventListener('click', () => {
      let historyEntry={
        string: `${getKeyword()}`,
        translation: `${$$("textarea#translation")[0].value}`
      };
      if(history.length>10){
        history.shift();
      }
      strHistory.push(historyEntry)
    });
}
function setText(str){
    let inputAria=$$("textarea#translation")[0];
    inputAria.value=str;
    inputAria.dispatchEvent(new Event('input', { bubbles: true }));
}

function base64ToString(base64Str) {
  const text = decodeURIComponent(escape(atob(base64Str)));
  return text;
}

const chromeRPC = async (type,inputData) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: type,
        data: inputData
      },
      (response) => {
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(response?.error || 'Unkown ERROR');
        }
      }
    );
  });
};

async function askAI(system,str){
    let config=await chromeRPC('GET_CONFIG');
    return await chromeRPC('CALL_AI',{
        model: config.model,
        type: 'json_object',
        messages: [
        {
          role: "user",
          content: `${str}`
        },
        {
            role: "system",
            content: `${system}`
        }
        ]
      });
}

async function invokeAI(){
    let config=await chromeRPC('GET_CONFIG');
    let context=getKeywordAll();
    context.shift();
    let Str=getKeyword();
    let src=$$(".singular")[0].textContent;
    pendingTread++;
    $$('button#ai_btn')[0].textContent=`${pendingTread} pending,${cacheThread} cache`;
    let response=await askAI(`You are translation assant.You need to automaticly detect the source string language and translate to ${config.targetLanguage}.you are translating [file,project,platform] in ${document.title}.you need to guess will this a GUI entry,a document,a html.or a GUI explanation,and read the translation history to have the best translation.you must output as pure json format,you will get a json like {"history":[{"string":"","translation":""}],"currentString":"","currentStringContext":["",""]} and you need to response in form {"translation":""}`,`{"history":${JSON.stringify(strHistory)},"currentString":${Str},"currentStringContext":${JSON.stringify(context)}}`);
    let result=JSON.parse(JSON.stringify(response));
    pendingTread--;
    cacheThread++;
    $$('button#ai_btn')[0].textContent=`${pendingTread} pending,${cacheThread} cache`;
    while($$(".singular")[0].textContent!=src){
        await new Promise(resolve => setTimeout(resolve, 500));;
    }
    setText(JSON.parse(response.choices[0].message.content).translation);
    cacheThread--;
    $$('button#ai_btn')[0].textContent=`${pendingTread} pending,${cacheThread} cache`;
}
async function copyAndCommit(){
  $$('button#action_copy_source')[0].click();
  await new Promise(resolve => setTimeout(resolve, 200));
  $$('button#suggest_translation')[0].click();
}
setupButton(invokeAI,copyAndCommit);


