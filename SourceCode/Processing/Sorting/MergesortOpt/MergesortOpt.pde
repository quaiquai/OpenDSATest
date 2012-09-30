final int numtests = 10;
final int testsize = 100;

void swap(int[] A, int i, int j) {
  int temp = A[i];
  A[i] = A[j];
  A[j] = temp;
}

void inssort(int[] A, int start, int len) {
  for (int i=start+1; i<start+len; i++)        // Insert i'th record
    for (int j=i; (j>start) && (A[j] < A[j-1]); j--)
      swap(A, j, j-1);
}

/* *** ODSATag: MergesortOpt *** */
void mergesort(int[] A, int[] temp, int l, int r) {
  int i, j, k, mid = (l+r)/2;  // Select the midpoint
  if (l == r) return;          // List has one record
  if ((mid-l) >= THRESHOLD) mergesort(A, temp, l, mid);
  else inssort(A, l, mid-l+1);
  if ((r-mid) > THRESHOLD) mergesort(A, temp, mid+1, r);
  else inssort(A, mid+1, r-mid);
  // Do the merge operation.  First, copy 2 halves to temp.
  for (i=l; i<=mid; i++) temp[i] = A[i];
  for (j=1; j<=r-mid; j++) temp[r-j+1] = A[j+mid];
  // Merge sublists back to array
  for (i=l,j=r,k=l; k<=r; k++)
    if (temp[i] < temp[j]) A[k] = temp[i++];
    else A[k] = temp[j--];
}
/* *** ODSAendTag: MergesortOpt *** */

void setup() {
  println("begin");
  int[] A = new int[testsize];
  int[] temp = new int[testsize];
  int i;

  // Perform numtests trials to test this
  for (int tests=0; tests<numtests; tests++) {
    for (i=0; i<A.length; i++)
      A[i] = int(random(1000))+1;
    mergesort(A, temp, 0, testsize-1);
    for (i=1; i<A.length; i++)
      if (A[i] < A[i-1]) {
        println("Error! Value " + A[i] + " at position " + i +
                " was less than " + A[i-1] + " at position " + (i-1));
        exit();
      }
  }
  println("Testing successful!");
}
