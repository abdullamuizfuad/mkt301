/* MKT301 practice portal: case studies.
   Each case: extended reading (sections), exhibits, boardroom arguments and practice questions.
   Practice questions are written for practice only. */

const CASES = [
{
  id: 'iceto',
  title: 'ICETO Gelato',
  subtitle: 'From Malé to Southeast Asia: one brand, two ways to sell',
  tag: 'Food & beverage · Singapore, Malaysia, Thailand',
  color: '#ff7a59',
  icon: '🍨',
  note: 'Teaching case. ICETO\'s internal figures, Selatan Frozen Foods, the people quoted and the 7-Eleven partnership details are created for classroom use. Market facts are simplified and approximate.',

  sections: [
  { id: 'origins', title: 'From Majeedhee Magu to the region', html: `
<p>ICETO opened in 2019 as a small gelato counter on Majeedhee Magu, Malé's busiest shopping street. The idea was simple: real Italian-style gelato, churned slowly in small batches, made with flavours that taste of the Maldives. Young coconut, pandan, tamarind-mango and toddy palm syrup sat next to classic pistachio and dark chocolate. The counter was painted in bright tropical colours and every cup was designed to be photographed. Within a year ICETO was one of the most tagged food brands in Malé on Instagram.</p>
<p>Six years later ICETO runs five outlets in Malé, Hulhumalé and Addu City, plus two counters inside resorts. All gelato is made in one central kitchen in Hulhumalé and delivered frozen to every outlet. In 2025 the company earned MVR 19 million in revenue with a gross margin of 48 percent. It has no debt, but most of its profit has been spent on opening new outlets, so cash for a large overseas project is limited. None of the three founders has ever run a business outside the Maldives.</p>
<div class="callout">Keep in mind: ICETO is profitable and well-loved at home, but it is <b>small, cash-limited and inexperienced abroad</b>. Every decision in this case has to fit those limits.</div>` },

  { id: 'people', title: 'The people around the table', html: `
<p>Seven people shape ICETO's plan. Their views often clash, and not every view is equally strong. Part of your job is to tell the difference.</p>
<div class="people">
<div class="person"><b>Yusuf Rasheed</b><span>Co-founder, product</span><p>Trained as a food scientist in Italy. Proud of the recipes and the slow-churn method. Believes the Malé formula is the reason for ICETO's success.</p></div>
<div class="person"><b>Aishath Nadha</b><span>Co-founder, brand</span><p>Studied pastry in Singapore and still has contacts there. Careful and protective of the brand. Asks the hardest questions in every meeting.</p></div>
<div class="person"><b>Hassan Zahir</b><span>Co-founder, operations and strategy</span><p>Spent ten years running food and beverage at Maldivian resorts. Thinks in systems and regions. His views are gaining support on the board.</p></div>
<div class="person"><b>Mariyam Shifa</b><span>Finance manager</span><p>Joined in 2023 from a Malé bank. Watches cash closely and worries about rents, currencies and travel costs.</p></div>
<div class="person"><b>Daniel Tan</b><span>Category buyer, 7-Eleven Singapore</span><p>Tasted ICETO at a regional food trade fair and suggested the partnership. Knows freezer sales data better than anyone, but his job is to fill 7-Eleven freezers profitably.</p></div>
<div class="person"><b>Farah Aziz</b><span>Business development, Selatan Frozen Foods</span><p>Wants ICETO as a new customer for Selatan's factory in Johor. Knowledgeable, persuasive and, naturally, keen to win the contract.</p></div>
<div class="person"><b>Niran Chaiyasit</b><span>ICETO's adviser in Bangkok</span><p>A former 7-Eleven Thailand manager who now advises foreign food brands. Hired by Hassan to explain how business works in Thailand.</p></div>
</div>
<p class="muted">Practise judging their arguments in the <b>Boardroom</b> tab.</p>` },

  { id: 'why', title: 'Why grow abroad, and why now?', html: `
<p>By 2025, growth in the Maldives was slowing. Almost every busy street in Malé and Hulhumalé already had an ICETO outlet or a competitor nearby, and the local population is just over half a million people. Tourists help, but most resort guests never visit Malé's shopping streets.</p>
<p>At a strategy day in late 2025 the founders listed four ways to grow:</p>
<ul>
<li><b>Sell more of the same gelato to the same Maldivian customers</b>, through loyalty offers, delivery apps and longer opening hours.</li>
<li><b>Create new products for the Maldives</b>, such as gelato cakes and packaged pints for supermarkets.</li>
<li><b>Take the existing gelato range into new markets overseas.</b></li>
<li><b>Start a completely different business</b>, such as a bakery-café chain.</li>
</ul>
<p>The board chose to focus on new markets abroad, while keeping a small product-development project running at home. Hassan summed it up: "Our gelato is proven. What we have run out of is customers, not ideas."</p>
<div class="callout">Theory link: these four options map onto a well-known growth matrix from Week 1. Which box is each option in?</div>` },

  { id: 'views', title: 'Three ways to run a region', html: `
<p>Agreeing to go abroad was easy. Agreeing <i>how</i> to run an overseas business was not.</p>
<p><b>Yusuf</b> wanted every overseas store to copy Malé exactly: same recipes, same prices, same design. "That is what made us successful. Why would we change a winning formula?"</p>
<p><b>Aishath</b> argued the opposite. Each country should be treated as a separate business, with its own local manager making all the decisions. "Singaporeans, Malaysians and Thais are different people. Someone in Malé cannot decide what a shopper in Bangkok wants."</p>
<p><b>Hassan</b> wanted something in between. "We should see Southeast Asia as one region, with one ICETO brand and one strategy, but let each country adjust flavours and promotions to local tastes." By early 2026, Hassan's view was winning support. Mariyam liked it because it avoided building three separate teams. Yusuf accepted it on one condition: the signature recipes would never change.</p>
<div class="callout">Theory link: management orientation (Week 1). Each founder's view matches a different stage. Be ready to explain the strengths <i>and</i> the weaknesses of each, not just name them.</div>` },

  { id: 'plan', title: 'The two-part plan', html: `
<p>Aishath's years in Singapore gave the founders their first contact in the region. In late 2025, Daniel Tan, a category buyer for 7-Eleven Singapore, tasted ICETO at a regional food trade fair and suggested a partnership.</p>
<p>7-Eleven is one of the best-known convenience-store brands in Southeast Asia. In each country the stores are run by a separate local operator under licence, but the operators share suppliers and ideas. Singapore has several hundred 7-Eleven stores, Malaysia has a large national network, and Thailand has one of the largest 7-Eleven networks in the world, with stores on almost every busy street (Exhibit 4).</p>
<p>From these conversations the founders built a two-part plan:</p>
<ul>
<li><b>Part one: a flagship ICETO store in Singapore.</b> A premium, sit-down store in a busy shopping district serving fresh scoops, gelato desserts and specialty coffee, designed to show the full ICETO experience. It would be owned and run by ICETO through a new Singapore company.</li>
<li><b>Part two: packaged ICETO gelato cups in 7-Eleven freezers.</b> Starting in Singapore, then rolling out to Malaysia and Thailand if sales targets are met.</li>
</ul>
<p>Hassan explains the logic: "The flagship tells people who we are. 7-Eleven puts us in their hand every day."</p>
<p>Aishath is less sure: "If people can buy ICETO for a few dollars at 7-Eleven, why would they pay much more at our flagship? We could end up confusing our own customers."</p>
<h4>How to open the flagship</h4>
<p>The founders looked at three routes for the flagship:</p>
<ul>
<li><b>Wholly owned:</b> a new ICETO company in Singapore. Full control over design, staff and service, but the largest investment in rent, fit-out and hiring. Singapore shop rents are among the highest in Asia.</li>
<li><b>Franchise:</b> a Singapore food-and-beverage group invests the money and runs the store, paying ICETO a fee. Cheaper for ICETO, but someone else delivers the brand experience.</li>
<li><b>Joint venture:</b> share the cost, risk and decisions with a local café group that knows the market.</li>
</ul>
<p>Mariyam's estimate: a wholly owned flagship would need about USD 450,000 for fit-out, deposits and the first six months of costs, more than half of ICETO's available cash. The board's current preference is to own it, because "the flagship <i>is</i> the brand".</p>` },

  { id: 'supply', title: 'Making the cups: Malé or Johor?', html: `
<p>Production is one of the biggest decisions. ICETO has two options for the 7-Eleven cups (Exhibit 2).</p>
<p><b>Option A: export from Malé.</b> ICETO would make the cups in its Hulhumalé kitchen and ship them frozen to Singapore. This keeps full control of quality and recipes, but costs about USD 1.55 per cup delivered and takes three to four weeks by refrigerated sea freight. The kitchen would need new packing equipment, and ICETO would have to get halal certification recognised in Malaysia and Singapore on its own. The Maldives is not an ASEAN member, so moving products from Malé into the region is slower and costs more.</p>
<p><b>Option B: contract manufacturing in Johor.</b> Daniel recommended Selatan Frozen Foods, a manufacturer in Johor, Malaysia, just across the causeway from Singapore. Selatan already makes frozen products for 7-Eleven in all three countries. It is halal-certified for both Malaysia and Singapore and trusted for food safety and on-time delivery. Selatan would make ICETO cups to ICETO's recipes for about USD 0.68 per cup and deliver to stores in one to two days. ICETO's team would approve every batch before it ships. Because Malaysia, Singapore and Thailand are all ASEAN members, cups made in Johor can move between them with fewer trade barriers.</p>
<p>Farah Aziz from Selatan is confident: "We already run 7-Eleven's frozen lines in three countries. You bring the recipes and the brand; we bring the scale."</p>
<p>Yusuf is uneasy: "Our gelato is slow-churned in small batches. A large factory may not respect that."</p>
<p>Aishath has a sharper worry: "Once they have our recipes, what stops them making a copy for someone else?"</p>
<div class="callout">Think about: what does each option do to cost, speed, control, certification and risk? And if ICETO chooses Selatan, what would you write into the contract?</div>` },

  { id: 'markets', title: 'Three markets, three environments', html: `
<p>The three markets are close together on the map, but very different to sell in (Exhibit 4).</p>
<p><b>Singapore</b> is a small, wealthy city-state with one of the highest incomes per person in the world. Its population is multicultural: Chinese, Malay, Indian and a large expatriate community, with English used widely in business. Consumers travel a lot, love trying new food concepts and are used to paying premium prices for a good café experience. Food safety rules are strict and clearly enforced. Halal certification matters for reaching Malay-Muslim customers. Competition for premium desserts is intense, with many international and local gelato shops.</p>
<p><b>Malaysia</b> is larger, with a Muslim-majority population and lower average incomes than Singapore. Halal certification is essential: many shoppers will not even consider a food product without it. Consumers are value-conscious, but young urban Malaysians spend readily on treats and trends they discover on TikTok and Instagram. Business relationships are built on trust and personal contact, and decisions often take time.</p>
<p><b>Thailand</b> is mainly Buddhist and has an enormous 7-Eleven network that sells a very large volume of snacks and desserts every day. Thai consumers love sweet tropical flavours such as coconut, mango and pandan, which ICETO already uses. Convenience-store prices are low and most shoppers are price-sensitive, although Bangkok and tourist areas such as Phuket support higher prices. Business culture is high-context: relationships, respect and saving face matter, and partners expect regular personal visits rather than emails.</p>
<p>Niran, ICETO's Bangkok adviser, puts it plainly: "In Thailand the contract is the last step, not the first. If they don't know your face, you will wait a long time for freezer space."</p>
<p>Across all three countries, exchange rates can move quickly against the US dollar, and governments can change food labelling and import rules with little notice.</p>` },

  { id: 'research', title: 'What the research showed', html: `
<p>Detailed published data on gelato in the region was hard to find, so ICETO combined three methods:</p>
<ul>
<li><b>Seeing for themselves.</b> Yusuf and Hassan spent two weeks in Singapore, Kuala Lumpur and Bangkok, standing at 7-Eleven freezers, visiting gelato shops and malls, and watching what people bought and how much they paid.</li>
<li><b>Partner data.</b> 7-Eleven Singapore shared sales data showing which frozen products sold best and at what times of day.</li>
<li><b>A survey</b> of 600 young consumers across the three cities.</li>
</ul>
<p>The research found four main customer groups (Exhibit 5):</p>
<ol>
<li><b>Young urban professionals in Singapore, aged 22 to 35.</b> Will pay SGD 7 to 9 for a premium café experience that feels special and looks good on social media.</li>
<li><b>Students and young shoppers in all three countries.</b> Buy on impulse, want a treat for under SGD 4 (or the local equivalent), and enjoy trying new flavours and limited editions.</li>
<li><b>Families.</b> Buy multipacks, are very price-sensitive and prefer familiar brands.</li>
<li><b>Tourists in Singapore and Bangkok.</b> Want something they cannot find at home and will try a new brand once.</li>
</ol>
<p>Three more findings stood out:</p>
<ul>
<li>Shoppers decide at the freezer in a few seconds, so packaging must explain the product instantly.</li>
<li>The Maldives is famous across the region as a luxury holiday destination, but very few people link it with food.</li>
<li>7-Eleven freezers are full of cheap mass-market ice cream, with a few imported premium pints at the top. <b>No brand offers tropical, artisan-style gelato at a mid-premium price</b> (Exhibit 6).</li>
</ul>
<p>7-Eleven's data added a detail: in Singapore, frozen dessert sales peak between 2 pm and 5 pm near schools and universities, and after 9 pm near offices and housing estates.</p>` },

  { id: 'product', title: 'Product and brand decisions', html: `
<p>The two parts of the plan need different products. The flagship will sell the full ICETO menu: fresh scoops, gelato cakes, desserts and specialty coffee. For 7-Eleven, ICETO will sell a sealed 120 ml cup and a four-pack of mini cups. Packaged gelato needs a longer shelf life than fresh gelato in Malé, so Yusuf must adjust the recipe without losing too much of the texture.</p>
<p>The ICETO name and three signature Maldivian flavours, young coconut, pandan and tamarind-mango, will be used in every market. Each country will add one local flavour to its 7-Eleven range:</p>
<ul>
<li><b>Singapore:</b> kaya toast</li>
<li><b>Malaysia:</b> teh tarik</li>
<li><b>Thailand:</b> Thai tea</li>
</ul>
<p>The flagship will also sell seasonal flavours that are never sold in 7-Eleven, to keep it special.</p>
<p>The team is still divided on the brand story. Yusuf wants "Gelato from the Maldives" in large letters on every pack and on the flagship's walls, using the country's dream-holiday image. Aishath worries that a country known for beaches, not food, may confuse shoppers who only have a few seconds at the freezer. She prefers to lead with taste and the tropical flavours, and keep the Maldives as a smaller detail.</p>` },

  { id: 'magnum', title: 'Learning from Magnum', html: `
<p>To plan how to build the brand, the founders studied Magnum, the global ice-cream brand. Most of Magnum's sales come from everyday products in supermarket and convenience-store freezers. Yet Magnum keeps a premium, indulgent image. One way it does this is with short-term luxury pop-up stores in major cities, where customers design their own bar in a stylish setting. The pop-ups sell far fewer products than the freezers, but they create photos, press coverage and a feeling of luxury that rubs off on the everyday bar.</p>
<p>ICETO plans to follow a similar model (Exhibit 7):</p>
<ul>
<li>Once the Singapore flagship is successful, ICETO will launch the brand in Malaysia and Thailand with <b>premium pop-up stores</b> instead of permanent flagships, while the 7-Eleven cups go on sale.</li>
<li>Its main event in each country will be a <b>pop-up at the biggest annual food festival</b>.</li>
<li>Smaller pop-ups will run in <b>shopping malls during major holidays</b> such as Hari Raya, Chinese New Year, Deepavali, Songkran and Christmas, when families and young people visit malls in large numbers.</li>
<li>ICETO will also attend <b>regional food trade shows</b> to meet retailers, distributors and hotel buyers.</li>
</ul>
<p>Mariyam reminds the board of one difference: "Magnum has one of the biggest marketing budgets in the industry. Everyone already knows the name. We are starting from zero."</p>` },

  { id: 'pricing', title: 'Pricing across the region', html: `
<p>In Malé, a single ICETO scoop costs MVR 65, about USD 4.20. Converting that price directly would make ICETO's cups far too expensive for convenience-store shoppers, especially in Malaysia and Thailand. But letting each 7-Eleven operator set its own price could create large price gaps between neighbouring countries. Traders might then buy cheap cups in one country and resell them in another, and the brand would mean different things in different places.</p>
<p>In 7-Eleven freezers there are three price levels (Exhibit 6): cheap mass-market ice cream at the bottom, well-known everyday premium brands such as Magnum in the middle, and expensive imported pints at the top. Premium gelato shops and pop-up stores charge much more per serving than any freezer product.</p>
<p>Hassan proposes a geocentric approach. ICETO would choose one price position for its cups and keep that same position against competitors in every country. Each country would then adjust the actual price for local incomes, taxes, retailer margins and exchange rates (Exhibit 3). The flagship and pop-up stores would be priced in line with other premium gelato shops.</p>
<p>Because the cups would be made in Johor, most production costs would be in Malaysian ringgit. Mariyam warns that currencies can move sharply: "If the baht falls ten percent, our Thai price is suddenly worth ten percent less to us. We need to review prices regularly, not once a year."</p>` },

  { id: 'decision', title: 'The board meeting', html: `
<p>In March 2026 the board meets in Malé to make its final decision. The questions on the table:</p>
<ul>
<li>How should ICETO think about the region: one formula, three separate businesses, or something in between?</li>
<li>Which customers should the flagship and the 7-Eleven cups each target, and how should each be positioned?</li>
<li>Should ICETO own the flagship, and should it accept Selatan as its manufacturer? How can it protect its recipes and quality?</li>
<li>Can one brand sit comfortably in both a premium café and a convenience-store freezer?</li>
<li>Can one price position really hold across three very different countries?</li>
</ul>
<p>"This is the biggest decision we have made since we opened the first counter," Hassan tells the board. "If we get Singapore right, 7-Eleven can take us across Southeast Asia. If we get it wrong, we may not get a second chance."</p>` }
  ],

  exhibits: [
  { title: 'Exhibit 1: ICETO at a glance (2025)', rows: [
    ['Founded','2019, Majeedhee Magu, Malé'],['Outlets','5 stores + 2 resort counters'],['Production','One central kitchen, Hulhumalé'],
    ['Revenue (2025)','MVR 19 million'],['Gross margin','48%'],['Debt','None'],['Cash for expansion','Limited'],['Instagram followers','78,000'],['International experience','None'] ] },
  { title: 'Exhibit 2: Supply options per 120 ml cup (ICETO finance estimates)', head: ['Factor','A: Export from Malé','B: Selatan (Johor)'], rows: [
    ['Cost delivered to Singapore store','USD 1.55','USD 0.68'],['Time to store','3–4 weeks (frozen sea freight)','1–2 days'],
    ['Quality control','Full ICETO control','ICETO approves every batch'],['Recipe protection','High','Depends on the contract'],
    ['Halal certification','Must be obtained separately','Already certified (MY and SG)'],['Supply to Malaysia and Thailand','Difficult and costly','Easier under ASEAN trade rules'] ] },
  { title: 'Exhibit 3: Proposed prices (illustrative, approximate)', head: ['Product and market','Planned price','Approx. USD'], rows: [
    ['Flagship scoop, Singapore','SGD 7.50','5.60'],['7-Eleven cup, Singapore','SGD 3.80','2.90'],['7-Eleven cup, Malaysia','MYR 10.50','2.40'],
    ['7-Eleven cup, Thailand','THB 79','2.20'],['Single scoop, Malé','MVR 65','4.20'] ] },
  { title: 'Exhibit 4: Market snapshot (approximate)', head: ['','Singapore','Malaysia','Thailand'], rows: [
    ['Population','~6 million','~34 million','~66 million'],['Income per person','Very high','Middle','Lower-middle'],
    ['Main religion','Mixed (Buddhist, Christian, Muslim, Hindu)','Muslim majority','Buddhist majority'],
    ['Halal certification','Important for Malay-Muslim buyers','Essential','Helpful for Muslim south and tourists'],
    ['7-Eleven network','Several hundred stores','A few thousand stores','Over 14,000 stores'],
    ['Shopper price sensitivity','Low to medium','Medium to high','High'],['Business culture','Direct, rules-based','Relationship-based','High-context, relationship-first'] ] },
  { title: 'Exhibit 5: Research segments', head: ['Segment','Where','Will pay','What they want'], rows: [
    ['Young urban professionals (22–35)','Singapore','SGD 7–9','Premium café experience, social-media-worthy'],
    ['Students and young shoppers','All three','Under SGD 4 (or local equivalent)','Impulse treat, new flavours, limited editions'],
    ['Families','All three','Lowest price per serving','Multipacks, familiar brands'],
    ['Tourists','Singapore, Bangkok','Will try once','Something they cannot get at home'] ] },
  { title: 'Exhibit 6: The 7-Eleven freezer price ladder (per serving, approx. USD)', head: ['Level','Examples','Approx. USD'], rows: [
    ['Top: imported premium pints','Well-known imported pint brands (per 120 ml)','3.50–4.50'],
    ['Middle: everyday premium','Magnum and similar','1.80–2.80'],['Bottom: mass-market','Local and regional ice-cream cups and sticks','0.80–1.20'],
    ['Outside the freezer','Premium gelato shops and pop-ups','5.00–7.00'] ] },
  { title: 'Exhibit 7: Planned brand-building calendar (draft)', head: ['Activity','Where','When'], rows: [
    ['Flagship opening','Singapore','Year 1'],['7-Eleven cups launch','Singapore → Malaysia → Thailand','Year 1 → Year 2'],
    ['Food festival pop-up','Biggest annual food festival in each country','Once a year per country'],
    ['Holiday mall pop-ups','Hari Raya, Chinese New Year, Deepavali, Songkran, Christmas','Around each holiday'],
    ['Regional food trade shows','Singapore and Bangkok','1–2 per year'] ] }
  ],

  /* Boardroom: v = strong | weak | mixed. 'why' explains without giving a model answer. */
  boardroom: [
  { topic: 'Running the region', who: 'Yusuf', role: 'Co-founder', v: 'weak',
    say: '"Copy Malé exactly. Same recipes, same prices, same design. It worked here, so it will work anywhere."',
    why: 'Look at the evidence: halal is essential in Malaysia, Thai shoppers are price-sensitive, and MVR 65 converted is far above what convenience-store shoppers pay. Which management orientation assumes the home way is best everywhere, and what does it miss?' },
  { topic: 'Running the region', who: 'Aishath', role: 'Co-founder', v: 'mixed',
    say: '"Treat each country as its own business with its own manager. Locals know their market best."',
    why: 'Strength: very responsive to local differences. Weakness: three teams cost money ICETO does not have, and separate decisions could create price gaps and three different brands. Which orientation is this, and when does it make sense?' },
  { topic: 'Running the region', who: 'Hassan', role: 'Co-founder', v: 'strong',
    say: '"One region, one ICETO brand, one strategy, but let each country adjust flavours and promotions."',
    why: 'It balances efficiency (one brand, one manufacturer) with local response (local flavours, holiday promotions). Can you name the orientation, and back it with two country differences from the case?' },
  { topic: 'Running the region', who: 'Niran', role: 'Bangkok adviser', v: 'strong',
    say: '"In Thailand the contract is the last step, not the first. If they don\'t know your face, you will wait a long time for freezer space."',
    why: 'This reflects a high-context business culture. What should ICETO budget for and do differently in Thailand compared with Singapore?' },

  { topic: 'Choosing customers', who: 'Mariyam', role: 'Finance manager', v: 'weak',
    say: '"Families buy multipacks. That is the biggest volume. Target them first."',
    why: 'Check Exhibit 5: families are very price-sensitive and prefer familiar brands. Is a new, unknown, mid-premium brand a good fit for them at launch?' },
  { topic: 'Choosing customers', who: 'Daniel', role: '7-Eleven buyer', v: 'strong',
    say: '"Shoppers decide in seconds. Keep the cup under SGD 4 and make the pack explain itself."',
    why: 'Backed by the research and by 7-Eleven\'s own data. Which segment does this describe, and what does it mean for packaging and price?' },
  { topic: 'Choosing customers', who: 'Aishath', role: 'Co-founder', v: 'mixed',
    say: '"Our flagship should chase tourists. They are the ones who know the Maldives."',
    why: 'Tourists will try a new brand once, but will they come back? Compare them with the young professionals who pay SGD 7–9 and share on social media. Primary or secondary target?' },
  { topic: 'Choosing customers', who: 'Yusuf', role: 'Co-founder', v: 'mixed',
    say: '"Put \'Gelato from the Maldives\' in big letters on every pack. Everyone dreams of the Maldives."',
    why: 'Country of origin can add value, but the research says few people link the Maldives with food, and freezer shoppers decide in seconds. Lead with origin, or with taste?' },

  { topic: 'Entry and supply', who: 'Yusuf', role: 'Co-founder', v: 'weak',
    say: '"Ship everything from Hulhumalé. That is the only way to protect quality."',
    why: 'Compare Exhibit 2: USD 1.55 vs 0.68, 3–4 weeks vs 1–2 days, halal and ASEAN rules. Is full control worth that cost and delay for a convenience-store product?' },
  { topic: 'Entry and supply', who: 'Farah', role: 'Selatan Frozen Foods', v: 'mixed',
    say: '"We already make 7-Eleven\'s frozen lines in three countries. You bring the brand; we bring the scale."',
    why: 'The facts are strong, but consider who is speaking: Farah wants the contract. Strong evidence from an interested party still needs safeguards. What would you check or write into the deal?' },
  { topic: 'Entry and supply', who: 'Aishath', role: 'Co-founder', v: 'strong',
    say: '"Once they have our recipes, what stops them making a copy for someone else?"',
    why: 'A real risk of contract manufacturing. Strong answers turn this worry into specific contract terms rather than rejecting the option.' },
  { topic: 'Entry and supply', who: 'Mariyam', role: 'Finance manager', v: 'mixed',
    say: '"A wholly owned flagship will eat more than half our cash. Franchise it instead."',
    why: 'She is right about cash and Singapore rents. But the flagship\'s job is to show the brand at its best. Who controls the experience under a franchise? Is there a middle route?' },

  { topic: 'Brand and promotion', who: 'Aishath', role: 'Co-founder', v: 'mixed',
    say: '"Cheap cups in 7-Eleven will kill the flagship. Nobody pays SGD 7.50 for something they can get for SGD 3.80."',
    why: 'Brand dilution is a genuine risk, but Magnum shows it can be managed. What keeps the flagship different: products, prices, experience?' },
  { topic: 'Brand and promotion', who: 'Hassan', role: 'Co-founder', v: 'strong',
    say: '"Do what Magnum did. Volume from the freezers, image from the pop-ups."',
    why: 'A sound model with a real example. But is ICETO\'s situation the same as Magnum\'s? Think budget and awareness.' },
  { topic: 'Brand and promotion', who: 'Mariyam', role: 'Finance manager', v: 'weak',
    say: '"Travel is expensive. We can manage the Thai operator by email and video calls."',
    why: 'Saves money in the short term, but ignores what Niran said about Thai business culture. What is the real cost of being a stranger to your partner?' },
  { topic: 'Brand and promotion', who: 'Daniel', role: '7-Eleven buyer', v: 'strong',
    say: '"Limited-edition local flavours get people talking. Students love them."',
    why: 'Fits the students and young shoppers segment, who enjoy new flavours. How do the local flavours balance a standard brand with local taste?' },

  { topic: 'Pricing', who: 'Yusuf', role: 'Co-founder', v: 'weak',
    say: '"Convert MVR 65 into each currency. Same price everywhere means same brand everywhere."',
    why: 'Same price in dollars is not the same price to a Thai student. Look at Exhibits 3 and 6: where would a USD 4.20 cup sit in the freezer?' },
  { topic: 'Pricing', who: 'Daniel', role: '7-Eleven buyer', v: 'weak',
    say: '"Let each 7-Eleven operator set its own price. They know their shoppers."',
    why: 'Local knowledge helps, but large price gaps between neighbours can lead to cross-border reselling and a confused brand. What is that problem called?' },
  { topic: 'Pricing', who: 'Mariyam', role: 'Finance manager', v: 'strong',
    say: '"If the baht falls ten percent, our Thai price is worth ten percent less to us. Review prices regularly."',
    why: 'Exchange-rate risk is real, and costs are in ringgit. What can ICETO adjust when currencies move?' },
  { topic: 'Pricing', who: 'Hassan', role: 'Co-founder', v: 'strong',
    say: '"Same position against competitors in every country. The actual price adjusts for local incomes, taxes and margins."',
    why: 'Consistent brand meaning with local flexibility. Use Exhibit 6 to decide which freezer level that position should be.' }
  ],

  /* Practice questions. slot groups the skill area; one question per slot is drawn for each set. */
  questions: [
  { id:'ic1a', slot:1, skill:'Management orientation', q:'Yusuf and Aishath hold opposite views about running ICETO abroad. Explain the management orientation each view reflects, and give ONE risk of each view for ICETO.',
    chips:[
      {t:'Ethnocentric: the home-country way is assumed best everywhere', g:1},
      {t:'Polycentric: each country is unique and run separately', g:1},
      {t:'Yusuf risk: MVR 65 converted is too high for MY/TH shoppers', g:1},
      {t:'Yusuf risk: no halal or local-taste adaptation for Malaysia', g:1},
      {t:'Aishath risk: three teams, costs ICETO cannot afford', g:1},
      {t:'Aishath risk: price gaps and an inconsistent brand', g:1},
      {t:'Yusuf\'s view is geocentric', g:0, why:'Copying the home formula unchanged is not geocentric thinking.'},
      {t:'Ethnocentric firms always fail abroad', g:0, why:'Over-claim. It can work in similar markets; the problem here is the evidence of differences.'},
      {t:'Cost-plus pricing formula', g:0, why:'Not relevant to management orientation.'} ],
    checks:['I named both orientations correctly','I explained each one, not just labelled it','Each risk is backed by case evidence','I kept to ONE risk per founder'] },
  { id:'ic1b', slot:1, skill:'International environment', q:'Choose ONE of Singapore, Malaysia or Thailand. Explain THREE features of its cultural, economic or legal environment that ICETO must respond to, and say what ICETO should do about each.',
    chips:[
      {t:'Malaysia: halal is essential, so use halal-certified production', g:1},
      {t:'Malaysia: value-conscious, but young urban buyers follow social-media trends', g:1},
      {t:'Thailand: price-sensitive shoppers, so watch pack size and price', g:1},
      {t:'Thailand: high-context business culture, so make regular personal visits', g:1},
      {t:'Singapore: strict food-safety rules, so approve every batch', g:1},
      {t:'Singapore: high incomes, so a premium flagship can work', g:1},
      {t:'Thailand is Muslim-majority', g:0, why:'Incorrect. Thailand is mainly Buddhist; Malaysia is Muslim-majority.'},
      {t:'All three countries share one currency', g:0, why:'Incorrect. SGD, MYR and THB move separately against the USD.'},
      {t:'Singapore has low incomes', g:0, why:'Incorrect. Singapore has one of the highest incomes per person in the world.'} ],
    checks:['I stayed with ONE country','I gave THREE different features','Each feature has a matching action for ICETO','I used case facts, not general statements'] },
  { id:'ic1c', slot:1, skill:'Culture', q:'Explain the difference between high-context and low-context cultures. How should this affect the way ICETO manages its relationship with the 7-Eleven operator in Thailand compared with Singapore?',
    chips:[
      {t:'High-context: meaning comes from relationships, trust and what is not said', g:1},
      {t:'Low-context: meaning is explicit, written and direct', g:1},
      {t:'Thailand: relationship first, contract last (Niran)', g:1},
      {t:'Thailand: regular personal visits, respect and saving face', g:1},
      {t:'Singapore: more direct, rules-based dealings', g:1},
      {t:'Budget for travel or a local representative', g:1},
      {t:'High-context means high-income', g:0, why:'Context is about communication style, not income.'},
      {t:'Manage everything by email to save cost', g:0, why:'This is Mariyam\'s weak argument. It ignores Thai business culture.'} ],
    checks:['I defined both terms clearly','I compared Thailand with Singapore','I gave practical actions for ICETO','I used a quote or fact from the case'] },

  { id:'ic2a', slot:2, skill:'Targeting and positioning', q:'Using the research findings, explain which segment the Singapore flagship should target first and why. Then write a positioning statement for the flagship.',
    chips:[
      {t:'Young urban professionals 22–35 pay SGD 7–9', g:1},
      {t:'They want a special, social-media-worthy experience', g:1},
      {t:'Tourists as a secondary group: they try once', g:1},
      {t:'Positioning formula: For [target] who [need], ICETO is the [frame] that [benefit] because [reason]', g:1},
      {t:'Point of difference: Maldivian tropical flavours, slow-churned, seasonal flavours only at the flagship', g:1},
      {t:'Target everyone to maximise sales', g:0, why:'A flagship with a premium price needs a focused target.'},
      {t:'Families, because they buy multipacks', g:0, why:'Multipacks are a freezer product; families are price-sensitive.'},
      {t:'Position on the lowest price in Singapore', g:0, why:'Contradicts the flagship\'s premium role.'} ],
    checks:['I chose one main segment and used research evidence','I explained why the others are weaker','My positioning statement names target, need, frame and benefit','My statement fits a premium flagship'] },
  { id:'ic2b', slot:2, skill:'Product–market grid', q:'Build a product–market grid for ICETO (the four segments × Singapore, Malaysia and Thailand). Use it to recommend where the flagship and the cups should focus first.',
    chips:[
      {t:'Students and young shoppers: all three countries → cups', g:1},
      {t:'Young professionals: Singapore → flagship', g:1},
      {t:'Tourists: Singapore and Bangkok → flagship and pop-ups', g:1},
      {t:'Families: later, if at all (price-sensitive, prefer familiar brands)', g:1},
      {t:'Roll out the cups Singapore → Malaysia → Thailand', g:1},
      {t:'Grid helps match each product to the best segment–country cells', g:1},
      {t:'Undifferentiated mass marketing across all cells', g:0, why:'Ignores the very different segments and markets.'},
      {t:'Open flagships in all three countries in year one', g:0, why:'The case plans pop-ups, not permanent flagships, for Malaysia and Thailand, and cash is limited.'} ],
    checks:['I drew or described the grid','I named which cells to focus on first','I linked each cell to research evidence','I made a clear recommendation'] },
  { id:'ic2c', slot:2, skill:'Target market strategies', q:'Explain the three target market strategy options (standardised, concentrated and differentiated). Which option is ICETO\'s two-part plan closest to? Justify with case evidence.',
    chips:[
      {t:'Standardised: one offer for the whole market', g:1},
      {t:'Concentrated: one segment only', g:1},
      {t:'Differentiated: different offers for different segments', g:1},
      {t:'Flagship for young professionals; cups for students and young shoppers', g:1},
      {t:'Different products, prices and channels for each', g:1},
      {t:'Risk: higher cost and possible brand confusion (Aishath)', g:1},
      {t:'ICETO is a mass marketer', g:0, why:'Two distinct offers for two segments is not mass marketing.'},
      {t:'Concentrated, because ICETO only sells gelato', g:0, why:'Selling one product category is not the same as targeting one segment.'} ],
    checks:['I explained all three options','I chose one and justified it with case evidence','I mentioned a risk or limitation','My answer is about segments, not just products'] },
  { id:'ic2d', slot:2, skill:'Positioning and country of origin', q:'Research shows few shoppers link the Maldives with food. Evaluate whether ICETO should position its cups on "Maldivian origin" or on "tropical taste", and recommend an approach.',
    chips:[
      {t:'Country-of-origin effect can add or lose value', g:1},
      {t:'The Maldives image is luxury holidays, not food', g:1},
      {t:'Shoppers decide in seconds at the freezer', g:1},
      {t:'Market gap: tropical, artisan, mid-premium', g:1},
      {t:'Lead with taste; keep origin as a supporting detail', g:1},
      {t:'Country of origin always increases value', g:0, why:'Over-claim. It depends on whether the country is linked with the product.'},
      {t:'Remove the ICETO name and use 7-Eleven\'s brand', g:0, why:'Loses the brand ICETO is trying to build.'} ],
    checks:['I weighed both options with evidence','I used the country-of-origin concept','I made a clear recommendation','I linked it to the freezer buying moment'] },

  { id:'ic3a', slot:3, skill:'Entry modes', q:'Compare the three ways ICETO could open its Singapore flagship (wholly owned, franchise, joint venture). Recommend one, using cost, control and risk.',
    chips:[
      {t:'Wholly owned: full control, highest cost and risk', g:1},
      {t:'Franchise: low cost to ICETO, less control of the experience', g:1},
      {t:'Joint venture: shared cost, risk and local knowledge, but shared decisions', g:1},
      {t:'The flagship\'s job is brand image, so control matters', g:1},
      {t:'Over half of ICETO\'s cash; Singapore rents are very high', g:1},
      {t:'Recommendation with a clear trade-off', g:1},
      {t:'Licensing gives the most control', g:0, why:'Licensing gives less control than ownership.'},
      {t:'Exporting is the same as franchising', g:0, why:'Different modes: exporting sells products; franchising licenses a business system.'} ],
    checks:['I compared all three modes','I used cost, control and risk','I used case numbers or facts','I made and justified one recommendation'] },
  { id:'ic3b', slot:3, skill:'Sourcing decisions', q:'Explain the main factors a company considers when deciding where to make its products. Apply them to ICETO\'s choice between Malé and Johor.',
    chips:[
      {t:'Cost per unit: USD 0.68 vs 1.55', g:1},
      {t:'Speed to market: 1–2 days vs 3–4 weeks', g:1},
      {t:'Trade agreements: ASEAN membership', g:1},
      {t:'Certification: Selatan already halal-certified', g:1},
      {t:'Quality control: batch approval vs full control', g:1},
      {t:'Protecting know-how: recipe risk', g:1},
      {t:'The Maldives is an ASEAN member', g:0, why:'Incorrect. That is exactly why shipping from Malé is harder.'},
      {t:'Labour cost is the only factor that matters', g:0, why:'Sourcing weighs many factors: speed, rules, quality, risk.'} ],
    checks:['I explained the factors in general first','I applied each to Malé vs Johor','I used Exhibit 2','I reached a conclusion'] },
  { id:'ic3c', slot:3, skill:'Managing a manufacturing partner', q:'If ICETO signs with Selatan, which safeguards should go into the contract? Explain why each one matters for ICETO.',
    chips:[
      {t:'Confidentiality and non-use of recipes', g:1},
      {t:'Exclusivity: no similar gelato for competitors', g:1},
      {t:'ICETO owns the brand and recipes', g:1},
      {t:'Batch approval and quality audits', g:1},
      {t:'Clear exit (termination) terms', g:1},
      {t:'Keep one key ingredient or base supplied by ICETO', g:1},
      {t:'No contract needed because 7-Eleven recommended them', g:0, why:'A recommendation is not protection.'},
      {t:'Share recipes informally to launch faster', g:0, why:'Increases exactly the risk Aishath raised.'} ],
    checks:['I gave at least three safeguards','Each safeguard is linked to a specific risk','I mentioned quality as well as recipes','My answer is practical for a small firm'] },

  { id:'ic4a', slot:4, skill:'Learning from a global brand', q:'Explain how Magnum\'s model can help ICETO build its brand, and ONE important way ICETO\'s situation is different from Magnum\'s.',
    chips:[
      {t:'Magnum: volume from everyday freezers', g:1},
      {t:'Magnum: premium image from luxury pop-ups', g:1},
      {t:'ICETO: cups for reach, flagship and pop-ups for image', g:1},
      {t:'Difference: Magnum has a huge budget and is already famous', g:1},
      {t:'Difference: ICETO is unknown and cash-limited', g:1},
      {t:'Magnum sells only in luxury stores', g:0, why:'Incorrect. Most Magnum sales come from everyday freezers.'},
      {t:'Copy Magnum\'s TV advertising budget', g:0, why:'Not realistic for ICETO\'s cash position.'} ],
    checks:['I described Magnum\'s model accurately','I applied it to ICETO\'s plan','I explained one clear difference','I said what the difference means for ICETO'] },
  { id:'ic4b', slot:4, skill:'Promotion and culture', q:'Design a launch campaign for ICETO cups in Malaysia aimed at young urban shoppers. Explain how each element fits Malaysian culture and the target segment.',
    chips:[
      {t:'TikTok and Instagram creators', g:1},
      {t:'Hari Raya mall pop-up, after Ramadan', g:1},
      {t:'Halal logo clearly on the pack', g:1},
      {t:'Teh tarik as the local flavour', g:1},
      {t:'Sampling near universities and colleges', g:1},
      {t:'Limited editions to create talk', g:1},
      {t:'Daytime food tasting events during Ramadan', g:0, why:'Insensitive. Muslims fast during daylight in Ramadan.'},
      {t:'Lead with "cheapest ice cream in Malaysia"', g:0, why:'Contradicts the mid-premium position.'} ],
    checks:['Every element links to the target segment','I showed cultural awareness','I used case facts (halal, teh tarik, social media)','My plan is affordable for ICETO'] },
  { id:'ic4c', slot:4, skill:'Standardise or adapt promotion', q:'Decide which parts of ICETO\'s marketing communications should be the same in every country and which should change. Justify your choices.',
    chips:[
      {t:'Same: name, logo and visual style', g:1},
      {t:'Same: three signature Maldivian flavours', g:1},
      {t:'Change: local flavour in each country', g:1},
      {t:'Change: holiday calendar for pop-ups', g:1},
      {t:'Change: language, creators and halal messaging', g:1},
      {t:'Balance: consistent brand, local relevance', g:1},
      {t:'Change the brand name in each country', g:0, why:'Destroys the one regional brand the plan depends on.'},
      {t:'Use one identical campaign everywhere', g:0, why:'Ignores religious, cultural and price differences.'} ],
    checks:['I split my answer into "same" and "change"','Each choice has a reason','I used examples from the case','I explained the overall balance'] },

  { id:'ic5a', slot:5, skill:'Grey markets', q:'What is a grey market? Explain how price gaps between countries could create one for ICETO cups, and suggest TWO ways to prevent it.',
    chips:[
      {t:'Genuine goods resold outside the intended channel or country', g:1},
      {t:'A cheaper Thai cup could be resold in Singapore', g:1},
      {t:'Harms brand consistency and partner trust', g:1},
      {t:'Keep the price gaps narrow (one price position)', g:1},
      {t:'Country-specific packs or labels', g:1},
      {t:'Contract terms with the 7-Eleven operators', g:1},
      {t:'A grey market means counterfeit goods', g:0, why:'Counterfeits are fakes. Grey-market goods are genuine.'},
      {t:'Raise all prices to the Singapore level', g:0, why:'Would price ICETO out of Malaysia and Thailand.'} ],
    checks:['I defined a grey market correctly','I explained how it could happen to ICETO','I gave TWO different prevention methods','I used Exhibit 3'] },
  { id:'ic5b', slot:5, skill:'Currency and pricing', q:'The Thai baht falls 15% against the US dollar. Explain how this affects ICETO (production costs are mostly in ringgit), and what ICETO could do.',
    chips:[
      {t:'THB 79 is now worth less in USD and MYR', g:1},
      {t:'Smaller margin per Thai cup', g:1},
      {t:'Option: raise the Thai price within the position', g:1},
      {t:'Option: absorb in the short term to protect volume', g:1},
      {t:'Option: change the pack size or mix', g:1},
      {t:'Review prices regularly (Mariyam)', g:1},
      {t:'Currency changes do not affect exporters', g:0, why:'They directly change what each sale is worth.'},
      {t:'Move production to Thailand immediately', g:0, why:'An extreme response to one currency move; not justified.'} ],
    checks:['I explained the effect with numbers or a clear example','I gave more than one possible response','I weighed the pros and cons','I linked it to keeping the brand position'] },
  { id:'ic5c', slot:5, skill:'Why prices differ by country', q:'Using Exhibit 3, explain why the same ICETO cup will have a different shelf price in Singapore, Malaysia and Thailand.',
    chips:[
      {t:'Local incomes and willingness to pay', g:1},
      {t:'Taxes and duties differ', g:1},
      {t:'Retailer margins differ', g:1},
      {t:'Exchange rates move', g:1},
      {t:'Competitor prices on each freezer shelf', g:1},
      {t:'Exhibit 3: SGD 3.80 / MYR 10.50 / THB 79 → USD 2.90 / 2.40 / 2.20', g:1},
      {t:'Production cost is different in each country', g:0, why:'All cups come from the same Johor factory.'},
      {t:'7-Eleven sets one global price', g:0, why:'Each country\'s operator is separate.'} ],
    checks:['I explained at least three factors','I used the numbers in Exhibit 3','I explained the result in USD terms','I linked it back to ICETO\'s brand'] }
  ]
}
];
