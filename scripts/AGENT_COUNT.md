# Total Agent Count

Based on analysis of migration files, here are all unique agent names:

## Core Agents (16 total)
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
13. Veteran Victor
14. English Second Language Elena
15. Tag Team Tanya & Tom
16. Comparing Carl

## Special Agents (2 total)
17. Angry Indian
18. Nick Fuentes

## Industry-Specific Agents

### Pest Control (10 unique)
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

### Fiber Internet (10 unique, but 2 share names with pest)
29. I Already Have Internet
30. I'm in a Contract
31. I'm Happy With What I Have
32. I Just Signed Up
33. I Don't Want to Deal With Switching
34. My Internet Works Fine
35. What's the Catch?
36. I'm Moving Soon
*(Note: "How Much Is It?" and "I Need to Talk to My Spouse" already counted above)*

### Roofing (10 unique, but 2 share names)
37. My Roof is Fine
38. I'm Not Interested
39. How Much Does a Roof Cost?
40. I Just Had My Roof Done
41. I'll Call You When I Need a Roof
42. I Already Have Someone
43. My Insurance Won't Cover It
44. I'm Selling Soon
45. I Don't Trust Door-to-Door Roofers
*(Note: "I Need to Talk to My Spouse" already counted)*

### Solar (10 unique, but 3 share names)
46. I'm Not Interested in Solar
47. Solar is Too Expensive
48. How Much Does It Cost?
49. My Electric Bill is Too Low
50. What If It Doesn't Work?
51. My Roof is Too Old
52. I've Heard Bad Things About Solar
53. I Don't Qualify
*(Note: "I Need to Talk to My Spouse" and "I'm Selling/Moving Soon" already counted)*

### Windows (10 unique, but 4 share names)
54. My Windows Are Fine
55. That's Too Expensive
56. I'm Going to Get Multiple Quotes
57. I Just Need One or Two Windows
58. I'll Just Do It Myself
59. What's Wrong With My Current Windows?
60. I'm Waiting Until...
*(Note: "How Much Is It?", "I Need to Talk to My Spouse", "I'm Selling/Moving Soon" already counted)*

## Summary

**Total Unique Agent Names: 60**

**Note:** Since migrations use `IF NOT EXISTS` checks based on agent name, agents with duplicate names (like "How Much Is It?" appearing in multiple industries) are the same database record, just assigned to multiple industries. The actual database record count is **60 unique agents**.
