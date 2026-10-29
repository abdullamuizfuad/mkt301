/* =====================================================================
   MKT301 study notes (Weeks 1 to 14)
   ---------------------------------------------------------------------
   NOTES301.weeks[n] holds the notes for teaching week n. They follow the
   lesson objectives in the subject outline (Green, Keegan & Warren,
   Global Marketing, 10th edition, chapters 1 to 17), written in plain
   English for final-year students. Areas that practice questions use
   most get the full treatment; the rest get a line or two.
   Practice material only. Examples are labelled as examples. Anything
   the lecturer should check against the textbook is listed in `review`.

   Week entry (same fields as MKT101's notes.js topic entry, plus a few):
     wk, title  week number and the outline topic
     big        the big idea in one line
     sum        one-line summary for the week list
     min        "In one minute" points
     lo         what students must be able to do
     ideas      [{h, p (text or list), l (list: text or [term, text]),
                  dia (flow | grid | compare | pyramid | rings), eg (list of examples), tip, more}]
     apply      {h, steps:[[step, text]]} how to use the idea on a case
     terms      [[term, meaning]] key terms (the term shows in bold)
     mistakes   common mistakes
     worked     {q, marks, plan:[...], model:[[tag, paragraph]]}
     check      [[question, answer]] quick checks with hidden answers
     prompts    three study prompts to copy into an AI study helper
   ===================================================================== */

const NOTES301={
 intro:"Short, plain-English notes for all 14 weeks of International Marketing. Each week has the big idea, the key terms, worked examples from global, Maldivian and Asian businesses, a step-by-step way to use the idea on a case, common mistakes, a worked practice question and quick checks.",
 how:[
  ["Start with the big idea","Read the one-line idea and the one-minute summary. Know where the week fits."],
  ["Learn the terms","Each key term is in bold. Say each one in your own words, then flip the cards."],
  ["Use the 'apply it to a case' steps","Every week has a short method. Practise it on the examples, then on the practice cases."],
  ["Test yourself","Answer the quick checks without looking. Then write the worked question on paper before you read the model."]
 ],
 weeks:{},
 review:[]
};

/* ===================== WEEK 10 ===================== */
NOTES301.weeks[10]={wk:10,title:"Global Marketing Communications Decisions 1: Advertising and Public Relations",
 big:"A global brand must decide how much of its message stays the same everywhere, and how much changes for each country.",
 sum:"Global advertising, standardised versus localised campaigns, the advertising industry, media around the world, and public relations versus publicity.",
 min:[
  "Global advertising means using the same brand name, images and message in many countries.",
  "The key decision is standardise or localise: keep one campaign everywhere, or change the message for each country. Most brands mix the two: one big idea, local details.",
  "Culture, language, religion, the product, advertising laws and the media available all push a brand towards one side or the other.",
  "Big advertising groups (agency holding companies) own many agency brands. Inside an agency, account, creative and media people build a campaign together.",
  "Publicity is media coverage the company does not pay for and cannot control. Public relations (PR) is the work the company does to manage that coverage and build goodwill."
 ],
 lo:"Explain standardised and localised advertising, the factors behind the choice, how agencies and media differ around the world, and how public relations protects a brand abroad.",
 ideas:[
  {h:"What is global advertising?",p:["Global advertising uses the same brand name, images, appeals and message in many country markets.","It saves money, builds one clear brand image, and lets a good idea travel. But one message may not fit every culture."],
   l:[["Global advertising","Messages whose art, copy, headlines, photos and slogans are the same, or very similar, in many countries."],["Big idea","The single creative concept behind a campaign. A good big idea can travel across borders while the details change."]],
   eg:["Example: Red Bull uses the same 'gives you wings' idea and extreme-sports content in almost every market.","Example: Coca-Cola's 'Share a Coke' campaign kept one idea everywhere, but printed local first names on the bottles in each country."]},
  {h:"Standardised or localised advertising",p:"This is the most important decision in global advertising. Think of it as a scale, not a yes-or-no choice.",
   dia:{type:"compare",title:"Two ends of the scale",cols:[["Standardised (extension)",["Same message and creative everywhere","Lower cost, one brand image","Fits universal products and global segments","Risk: message may not fit local culture"]],["Localised (adaptation)",["Language, images or appeal change by country","Higher cost, more local relevance","Fits culture-bound products such as food and beauty","Risk: brand image can become inconsistent"]]]},
   l:[["Standardised advertising","The same message and creative in every country. Only the language may change."],["Localised advertising","The message, images or appeal are changed to suit each country's culture, laws or media."],["Pattern advertising","The middle way: one overall theme and look, with local copy, faces and details."]],
   eg:["Example: Dove keeps its 'real beauty' theme worldwide, but uses local women and local beauty issues in each country. That is pattern advertising.","Example: A Sri Lankan tea brand shows a calm morning cup in Europe, but a family sharing tea at a festival in South Asia. Same product, localised appeal."],
   tip:"Do not just define the two types. Always say which one fits the business in the question, and why."},
  {h:"What decides standardise or localise?",p:"Look for these factors in any case. Each one pushes the decision one way.",
   l:[["Culture, language and religion","Where values, humour or religion differ a lot, the message usually needs to change."],["Type of product","Universal products (phones, airlines, luxury goods) can standardise. Culture-bound products (food, drinks, beauty, clothing) often need to localise."],["Advertising laws","Some countries ban or limit ads for alcohol, tobacco, medicine, or ads aimed at children. Comparative ads are banned in some places."],["Media available","If TV is weak but mobile is strong, the media plan must change even if the message does not."],["Global target segment","If the target is the same everywhere (for example, global business travellers or young gamers), one message can work."],["Cost and brand control","One campaign is cheaper and keeps the brand consistent."]],
   eg:["Example: An airline such as Emirates can use one global campaign about comfort and service, because travellers want the same benefits everywhere.","Example: A noodle brand like Maggi changes flavours and ad stories in each Asian country, because food tastes are local."]},
  {h:"The advertising industry and agency people",p:["Most global advertising is made by agencies. A few huge agency holding companies own many agency brands around the world.","An agency brand is the name a client works with. The holding company owns it, with other brands, and shares money and data across them."],
   l:[["Agency holding company","A group that owns several agency brands, for example WPP, Omnicom or Publicis Groupe."],["Agency brand","An individual agency the client deals with, such as Ogilvy (owned by WPP)."],["Account services","The account manager links the client and the agency, and keeps the campaign on brief."],["Creative team","Copywriters and art directors turn the strategy into words and pictures."],["Media planning and buying","Planners choose which media reach the target; buyers buy the space and time."]],
   more:"The world's biggest advertisers are mostly large consumer-goods, car, tech and online retail companies. You do not need exact rankings; know that big global firms spend billions each year.",
   eg:["Example: A global drinks company may hire one agency brand from a holding company to run its campaign in 40 countries, using the holding company's local offices for media buying."]},
  {h:"Media around the world",p:"Media availability varies by country. The best message fails if it is in the wrong media.",
   l:[["Mobile first","In much of Asia and Africa, many people reach the internet mainly through phones, so short video and social media matter more."],["Government limits","Some governments control TV or limit foreign ads, or restrict ad time."],["Local media habits","Radio still matters in rural areas. Outdoor and cinema ads are strong in some cities."]],
   eg:["Example: In the Maldives, many brands reach young people through Instagram and TikTok, and reach families through local TV and Viber groups, rather than newspapers.","Example: In India and Indonesia, short video ads on phones reach far more young buyers than print."]},
  {h:"Public relations and publicity",p:"Customers trust news and word of mouth more than ads. That is why PR matters, especially in a foreign market where the brand is new.",
   dia:{type:"compare",title:"Publicity and public relations",cols:[["Publicity",["Media coverage about the company","Not paid for","The company cannot control it","Can be good or bad"]],["Public relations",["Planned work by the company","Builds goodwill and trust","Manages publicity, especially in a crisis","Tools: press releases, events, sponsorship, social media, community work"]]]},
   l:[["Publicity","Communication about a company or product that the company does not pay for and does not control."],["Public relations (PR)","The company's planned work to build goodwill with the public, media and government, and to manage publicity."],["Crisis management","How PR responds when something goes wrong: act fast, tell the truth, show care, fix the problem, and update people."]],
   eg:["Example: In 2015, food safety officials in India said Maggi noodles had too much lead. Nestlé withdrew the product. It later returned with safety tests, clear messages and celebrity support. This shows bad publicity, then PR to rebuild trust.","Example: When Samsung's Galaxy Note 7 batteries caught fire in 2016, Samsung recalled every phone worldwide and later explained its new safety checks. A fast, global recall protected the brand.","Example: A Maldivian resort that cleans reefs with local schools and shares the story with travel media is using PR to win good publicity."],
   tip:"Publicity is the coverage. PR is the work. If a question asks for the difference, say who controls it and who pays."}
 ],
 apply:{h:"How to use this on a case",steps:[["Name the choice","Standardise, localise, or a mix (pattern). Say which."],["Find two factors in the case","Culture, product type, laws, media, segment, cost. Quote facts."],["Link factor to decision","'Because ___, the brand should ___.'"],["Give one example of the message","Show what the ad would say or show in that country."],["For PR, plan the response","What happened, what the company does first, who it talks to, how it rebuilds trust."]]},
 terms:[["Global advertising","The same or very similar ad messages, images and slogans used in many countries."],["Standardised advertising","One message and creative for every country."],["Localised advertising","Ads changed to suit each country's culture, laws or media."],["Pattern advertising","One theme across countries, with local details."],["Agency holding company","A group that owns several advertising agency brands."],["Agency brand","An individual agency inside a holding company."],["Media availability","Which media exist and reach people in a country, and what rules apply to them."],["Publicity","Unpaid, uncontrolled media coverage about a company."],["Public relations","Planned activity to build goodwill and manage publicity."]],
 mistakes:["Saying 'standardised means the same language'. Standardised means the same message and creative; the language can still be translated.","Giving a factor without linking it to the decision ('culture is important' gets little credit).","Mixing up publicity and PR.","Using an example without saying which type of advertising it shows."],
 worked:{marks:6,q:"A Thai skincare brand plans to advertise its sunscreen in Japan, Australia and the Gulf states. Should it use one standardised campaign or localise it? Explain two factors and give one example of how the ads could differ.",
  plan:["Define standardised and localised advertising.","Factor 1: culture and religion (for example, modest images in the Gulf states).","Factor 2: product and customer needs (skin types, sun strength, beauty ideals).","Recommend pattern advertising: one theme, local details.","Example: what the Japan ad and the Gulf ad would show."],
  model:[["Define","Standardised advertising uses the same message and creative in every country. Localised advertising changes the message, images or appeal to suit each country."],["Factor 1","Culture and religion differ. In the Gulf states, ads must show modest clothing, so beach images used in Australia would not fit."],["Factor 2","Customer needs differ. Australians want strong sun protection for outdoor life. Many Japanese buyers want light, non-greasy sunscreen that keeps skin bright."],["Recommend","The brand should use pattern advertising: one theme, such as 'protection that feels like nothing', with local models, images and benefits."],["Example","The Japan ad could show an office worker applying a light cream before a commute. The Gulf ad could show a family day in a park, with modest clothing."]]},
 check:[["What is the difference between publicity and public relations?","Publicity is unpaid media coverage the company cannot control. PR is the company's planned work to build goodwill and manage that coverage."],["Name three factors that push a brand to localise its ads.","Any three: culture, language, religion, culture-bound product, advertising laws, media habits."],["What is pattern advertising?","One overall theme and look in every country, with local copy, faces and details."]],
 prompts:["I am a final-year international marketing student. Explain standardised, localised and pattern advertising in simple English, with one Asian brand example of each. Then give me a short case and ask me to choose one and justify it.","Explain the difference between publicity and public relations in simple English. Then give me a short crisis story about a food brand in a foreign country and ask me to plan the PR response in five steps.","Act as my tutor. Ask me five quick questions on global advertising: agency holding companies, agency roles and media availability around the world. Correct my answers briefly."]
};
NOTES301.review.push(
 [10,"'Pattern advertising' is used as the middle option between standardised and localised. Check this term matches the lecture slides."],
 [10,"Agency examples (WPP, Omnicom, Publicis Groupe, Ogilvy) are current at the time of writing; check against chapter 13's list."],
 [10,"Maggi India (2015) and Samsung Galaxy Note 7 (2016) are used as PR examples; check they suit the class."]
);
