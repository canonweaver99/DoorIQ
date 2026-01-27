# Agent Count Analysis

Based on migration files, here are all unique agent names:

## Original Agents (Migration 017)
1. Austin
2. No Problem Nancy
3. Already Got It Alan
4. Not Interested Nick
5. DIY Dave
6. Too Expensive Tim
7. Spouse Check Susan
8. Busy Beth
9. Renter Randy
10. Skeptical Sam
11. Just Treated Jerry
12. Think About It Tina

## Additional Agents (Migration 050)
13. Veteran Victor
14. English Second Language Elena
15. Tag Team Tanya & Tom
16. Comparing Carl

## Special Agents
17. Angry Indian (Migration 129)
18. Nick Fuentes (Migration 134)

## Pest Control Specific (Migration 142)
19. I Already Have a Pest Guy
20. I Don't Have Any Bugs
21. How Much Is It?
22. I Need to Talk to My Spouse
23. I'm Renting/Don't Own
24. I Just Spray Myself
25. Send Me Information
26. We're Selling/Moving Soon
27. I Have Pets/Kids - Worried About Chemicals
28. Bad Timing - Call Me Back Later

## Fiber Internet Specific (Migration 144)
29. I Already Have Internet
30. I'm in a Contract
31. I'm Happy With What I Have
32. I Just Signed Up
33. I Don't Want to Deal With Switching
34. My Internet Works Fine
35. What's the Catch?
36. I'm Moving Soon

## Roofing Specific (Migration 145)
37. My Roof is Fine
38. I'm Not Interested
39. How Much Does a Roof Cost?
40. I Just Had My Roof Done
41. I'll Call You When I Need a Roof
42. I Already Have Someone
43. My Insurance Won't Cover It
44. I'm Selling Soon
45. I Don't Trust Door-to-Door Roofers

## Solar Specific (Migration 146)
46. I'm Not Interested in Solar
47. Solar is Too Expensive
48. How Much Does It Cost?
49. I'm Selling/Moving Soon
50. My Electric Bill is Too Low
51. What If It Doesn't Work?
52. My Roof is Too Old
53. I've Heard Bad Things About Solar
54. I Don't Qualify

## Windows Specific (Migration 147)
55. My Windows Are Fine
56. That's Too Expensive
57. I'm Going to Get Multiple Quotes
58. I Just Need One or Two Windows
59. I'll Just Do It Myself
60. What's Wrong With My Current Windows?
61. I'm Waiting Until...

## Duplicate Names (Same Database Record)
- "How Much Is It?" appears in Pest, Fiber, Solar, Windows
- "I Need to Talk to My Spouse" appears in Pest, Fiber, Roofing, Solar, Windows
- "How Much Does It Cost?" appears in Solar
- "How Much Does a Roof Cost?" appears in Roofing
- "I'm Selling/Moving Soon" appears in Pest, Solar, Windows
- "That's Too Expensive" appears in Windows
- "I'm Not Interested" appears in Roofing
- "I'm Not Interested in Solar" appears in Solar

## Total Count
**Total unique agent names: ~61**

However, since many agents share the same name across industries and the migrations use `IF NOT EXISTS` checks, the actual database record count would be lower (around 50-55 unique records).
