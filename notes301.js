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

/* ===================== WEEK 11 ===================== */
NOTES301.weeks[11]={wk:11,title:"Global Marketing Communications Decisions 2: Sales Promotion, Personal Selling and Special Forms",
 big:"Beyond advertising, a global brand uses short-term offers, people and special media to move customers from interest to action.",
 sum:"Sales promotion tools, the strategic/consultative personal selling model, choosing the nationality of the sales force, direct marketing, and support media, sponsorship and product placement.",
 min:[
  "Sales promotion is any short-term offer that gives customers or the trade a reason to buy now: samples, coupons, discounts, contests, loyalty points.",
  "Promotions must fit local laws and habits. Some countries limit discounts, contests or free gifts.",
  "Personal selling is face-to-face (or video) communication with a buyer. It matters most for expensive, technical or business products.",
  "The strategic/consultative selling model has five strategic steps and a six-step presentation plan.",
  "Companies choose expatriate, host-country or third-country salespeople, depending on the market, the product and the customer.",
  "Direct marketing, sponsorship, product placement and support media complete the promotion mix. Each tool should reach a clear customer group."
 ],
 lo:"Choose suitable sales promotion tools for a foreign market, explain the personal selling model and sales force nationality, and show how direct marketing, sponsorship and product placement fit the promotion mix.",
 ideas:[
  {h:"Sales promotion",p:["Sales promotion is any paid, short-term communication that adds value to a product to make people buy now. It can target consumers or the trade (distributors and retailers).","It works well when a brand is new in a country: it lowers the risk of trying it."],
   l:[["Sampling","Giving a small free amount so people can try the product."],["Coupons and price deals","Money off, buy-one-get-one, or bundle offers."],["Contests and sweepstakes","Chances to win prizes. Some countries restrict games of chance."],["Loyalty programmes","Points or rewards for repeat buying."],["Trade promotions","Extra margin, free stock or display support for retailers so they stock and show the product."]],
   eg:["Example: When a new energy drink enters Sri Lanka, the brand gives free cans at universities and gyms to get trial from young adults.","Example: A Maldivian telecom company gives extra data to customers who top up during Ramadan nights.","Example: A shampoo brand gives supermarkets in Indonesia a free shelf display and a discount if they order 20 cartons."],
   tip:"Match each tool to a goal: trial (samples), repeat buying (loyalty points), or getting shelf space (trade promotion)."},
  {h:"Sales promotion abroad: what to watch",l:[["Laws","Some countries cap discount levels, ban some contests, or limit free gifts with purchase."],["Culture and religion","Prizes and timing must suit local values, for example no alcohol prizes in Muslim countries."],["Retail structure","Where shops are small and independent, coupons are harder to manage than instant discounts."],["Brand image","Too many deals can cheapen a premium brand."]],
   eg:["Example: A premium chocolate brand avoids deep discounts in Japan, because buyers link low prices with low quality. It uses limited-edition gift boxes instead."]},
  {h:"Personal selling and the strategic/consultative model",p:"Personal selling is two-way, person-to-person communication with a buyer. It is costly, so it is used where products are expensive, complex or sold business-to-business. The model has two parts: a strategy, then the presentation.",
   dia:{type:"flow",title:"Strategic steps (before meeting the buyer)",steps:[["Personal selling philosophy","Believe in the marketing concept: solve the customer's problem."],["Relationship strategy","Plan to build trust and long-term relationships."],["Product strategy","Know the product well and how it creates value for this buyer."],["Customer strategy","Understand the buyer's needs, buying process and culture."],["Presentation strategy","Set goals for each call and plan how to deliver the presentation."]]},
   more:"The presentation plan then follows six steps: approach (make contact and build rapport), presentation (find needs and show benefits), demonstration (show it working), negotiation (handle concerns, agree terms), close (ask for the order), and servicing (follow up after the sale).",
   eg:["Example: A Japanese company selling water desalination units to resort islands first studies each resort's water use (customer strategy), then demonstrates a small unit on site, agrees a service contract (negotiation), and visits every six months (servicing)."],
   tip:"In high-context cultures, the approach and relationship steps take longer. Do not rush to the close."},
  {h:"Sales force nationality",p:"Who should sell for the company abroad? There are three choices.",
   dia:{type:"compare",title:"Three choices of salesperson",cols:[["Expatriate",["From the home country","Knows the product and company well","Costly; may not know local culture"]],["Host-country national",["From the local market","Knows language, culture and buyers","Less known to head office; may need product training"]],["Third-country national",["From another country","Often regional experience and languages","Can be a good middle option"]]]},
   l:[["Company and product","A complex, technical product may need home-country experts at first."],["Market and customers","Buyers who prefer to deal with people of their own culture favour host-country staff."],["Cost and stage","Expatriates cost much more; local staff suit a mature, stable market."],["Image","Some buyers expect to meet staff from the brand's home country."]],
   eg:["Example: A German machinery maker sends engineers from Germany to win its first buyers in Vietnam, then hires and trains Vietnamese sales staff.","Example: A Singapore-based regional manager from India leads sales for a software firm across South Asia: a third-country national."]},
  {h:"Direct marketing",p:"Direct marketing communicates straight with chosen customers to get a response, such as an order or a visit. It can be measured easily.",
   l:[["Direct mail and email","Personal letters or emails to chosen customers."],["Catalogues","Printed or online product books."],["Infomercials and TV shopping","Long TV ads or shopping channels that sell directly."],["Online and mobile","Apps, messaging, text offers and social media ads with a 'buy' button."]],
   eg:["Example: A Maldivian airline emails past passengers a discount on a route they have flown before.","Example: A Korean beauty brand sells to Malaysian buyers through its own app with a first-order discount."],
   tip:"Direct marketing must follow local data and privacy laws, and some customers dislike unwanted messages."},
  {h:"Support media, sponsorship and product placement",l:[["Support media","Outdoor (billboards, transit ads) and other media that remind people about the brand."],["Sponsorship","Paying to link the brand with an event, team or cause the target audience cares about."],["Product placement","Paying for the brand to appear inside a film, TV show, music video or game."]],
   eg:["Example: Emirates sponsors football clubs and tennis tournaments to reach fans around the world.","Example: Korean drama series show phones, cars and cosmetics on screen, which raises demand across Asia.","Example: A Maldivian bank sponsors a national school sports event to build goodwill with families."],
   tip:"Always say who the tool reaches. 'Sponsorship of a football club reaches young male fans in many countries' is better than 'sponsorship increases awareness'."}
 ],
 apply:{h:"How to use this on a case",steps:[["Name the customer group","Who are we trying to reach? Use the case's segments."],["Choose the tool","Sampling, discount, loyalty, trade deal, personal selling, sponsorship, placement or direct marketing."],["Say why it fits","Link the tool to that group's habits and to the brand's image."],["Check local limits","Laws, culture, religion, media habits."],["Say how you will measure it","Trial numbers, repeat purchase, leads, sales."]]},
 terms:[["Sales promotion","A short-term offer that gives a reason to buy now."],["Trade promotion","Incentives for retailers or distributors to stock and display a product."],["Personal selling","Person-to-person communication to persuade a buyer."],["Strategic/consultative selling model","A selling approach with five strategic steps and a six-step presentation plan."],["Expatriate","An employee working outside their home country."],["Host-country national","A local employee in the foreign market."],["Third-country national","An employee from neither the home country nor the host market."],["Direct marketing","Communication straight to chosen customers to get a measurable response."],["Sponsorship","Paying to link a brand with an event, team or cause."],["Product placement","Paying for a brand to appear in films, shows or games."]],
 mistakes:["Listing promotion tools without saying which customer group each one reaches.","Forgetting that some promotions are illegal or unsuitable in some countries.","Mixing up the five strategic steps with the six presentation steps.","Choosing expatriate staff without explaining the higher cost."],
 worked:{marks:6,q:"A Malaysian halal cosmetics brand is launching in Pakistan and the United Kingdom. Recommend two promotion tools for its launch and explain which customer group each tool would reach.",
  plan:["Name two different customer groups (for example, young women in Pakistani cities; British Muslim shoppers).","Tool 1 with reasons: sampling through beauty stores and universities.","Tool 2 with reasons: sponsorship or social media influencers.","Check one local limit (privacy, culture).","Say how success would be measured."],
  model:[["Tool 1: sampling","The brand should give free samples in beauty stores and at women's universities in Lahore and Karachi. Young urban women like to try new products before buying, so a sample lowers the risk of switching brands."],["Tool 2: influencers and events","In the UK, the brand could sponsor modest-fashion events and work with British Muslim beauty creators online. This reaches young Muslim shoppers who look for halal beauty products they can trust."],["Fit and limits","Both tools build trial without heavy discounting, so the brand keeps a quality image. Promotions must follow UK advertising rules on honest claims."],["Measure","Count samples given, app sign-ups and repeat purchases in the first three months."]]},
 check:[["Name the six steps of the selling presentation.","Approach, presentation, demonstration, negotiation, close, servicing."],["Give one reason to hire host-country salespeople.","They know the language, culture and buyers, and cost less than expatriates."],["What is product placement?","Paying for a brand to appear inside a film, TV show, music video or game."]],
 prompts:["I am a final-year international marketing student. Explain the strategic/consultative selling model in simple English, using a company selling equipment to resorts as the example.","Give me three short stories about companies entering new countries. For each, ask me which sales promotion tool fits best and why. Correct my answers.","Explain expatriate, host-country and third-country salespeople in simple English. Then give me a case and ask me to choose one and justify it."]
};
NOTES301.review.push(
 [11,"The five strategic steps and six presentation steps follow the strategic/consultative selling model in chapter 14; check the step names match the lecture slides."],
 [11,"Sales force nationality factors are summarised in simplified form; check the chapter's list of contingency factors."]
);
